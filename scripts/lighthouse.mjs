// Lighthouse (mobile) for home / post / category of both sites: production (legacy) vs v2.
//
//   1. npm run build && npx next start -p 3200      (v2 against the real WP, no mocks)
//   2. node scripts/lighthouse.mjs                  (writes perf/lighthouse.json)
//
// v2 is opened as `http://<site>.baptist.org.md` mapped to 127.0.0.1:3200 by Chrome's
// --host-resolver-rules, so the Host header is the production one: no staging `noindex`,
// real canonical/robots — what Lighthouse SEO should judge. Throttling is Lighthouse's default
// mobile simulation (Slow 4G, 4× CPU), so the network path to the server matters little;
// the comparison is dominated by page weight, JS and render path.
//
// Env: LH_RUNS (default 3, the median run per category is used), LH_V2_PORT (3200),
//      LH_ONLY=prod|v2, CHROME_PATH.
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const RUNS = Number(process.env.LH_RUNS ?? 3);
const V2_PORT = process.env.LH_TLS_PORT ?? '3443'; // scripts/tls-proxy.mjs in front of next start
const ONLY = process.env.LH_ONLY;

const chromePath =
  process.env.CHROME_PATH ??
  (() => {
    const base = path.join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
    const dir = fs.existsSync(base) ? fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop() : null;
    return dir ? path.join(base, dir, 'chrome-win64', 'chrome.exe') : undefined;
  })();

/** Same pages on both: ids from docs/PROMPTS.md (P0.2) and src/config/sites.ts. */
const PAGES = {
  ru: { home: '/', post: '/post?id=113186', category: '/category?id=17' },
  ro: { home: '/', post: '/post?id=16303', category: '/category?id=23' },
};

const targets = [];
for (const site of ['ru', 'ro']) {
  for (const [page, p] of Object.entries(PAGES[site])) {
    if (ONLY !== 'v2') targets.push({ env: 'prod', site, page, url: `https://${site}.baptist.org.md${p}` });
    if (ONLY !== 'prod') targets.push({ env: 'v2', site, page, url: `https://${site}.baptist.org.md${p}` });
  }
}

const CATS = ['performance', 'accessibility', 'best-practices', 'seo'];

async function once(target) {
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--ignore-certificate-errors',
      // Only for v2: the production run must reach the real servers.
      ...(target.env === 'v2'
        ? [`--host-resolver-rules=MAP ru.baptist.org.md 127.0.0.1:${V2_PORT},MAP ro.baptist.org.md 127.0.0.1:${V2_PORT}`]
        : []),
    ],
  });
  try {
    const result = await lighthouse(target.url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: CATS });
    const lhr = result.lhr;
    if (lhr.runtimeError) throw new Error(lhr.runtimeError.message);
    const a = (id) => lhr.audits[id];
    return {
      finalUrl: lhr.finalDisplayedUrl,
      scores: Object.fromEntries(CATS.map((c) => [c, Math.round((lhr.categories[c].score ?? 0) * 100)])),
      metrics: {
        fcp: a('first-contentful-paint').numericValue,
        lcp: a('largest-contentful-paint').numericValue,
        tbt: a('total-blocking-time').numericValue,
        cls: a('cumulative-layout-shift').numericValue,
        si: a('speed-index').numericValue,
        bytes: a('total-byte-weight').numericValue,
      },
      failed: Object.values(lhr.audits)
        .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'manual')
        .map((x) => ({ id: x.id, title: x.title, score: x.score, display: x.displayValue ?? '', cats: CATS.filter((c) => lhr.categories[c].auditRefs.some((r) => r.id === x.id && r.weight > 0)) }))
        .filter((x) => x.cats.length > 0),
    };
  } finally {
    await chrome.kill();
  }
}

const out = [];
for (const t of targets) {
  const runs = [];
  for (let i = 0; i < RUNS; i += 1) {
    try {
      runs.push(await once(t));
    } catch (e) {
      console.error(`  run ${i + 1} failed: ${e.message}`);
    }
  }
  if (runs.length === 0) {
    out.push({ ...t, error: 'all runs failed' });
    continue;
  }
  // The median run by performance score (so metrics and failed audits belong to one real run).
  const sorted = [...runs].sort((a, b) => a.scores.performance - b.scores.performance);
  const mid = sorted[Math.floor(sorted.length / 2)];
  out.push({ ...t, runs: runs.length, perfRuns: runs.map((r) => r.scores.performance), ...mid, a11yMin: Math.min(...runs.map((r) => r.scores.accessibility)) });
  console.log(`${t.env} ${t.site} ${t.page}: ${JSON.stringify(mid.scores)} (perf runs ${runs.map((r) => r.scores.performance)}) lcp=${Math.round(mid.metrics.lcp)}ms`);
}

fs.mkdirSync('perf', { recursive: true });
const file = ONLY ? `perf/lighthouse.${ONLY}.json` : 'perf/lighthouse.json';
fs.writeFileSync(file, JSON.stringify({ date: new Date().toISOString(), runs: RUNS, results: out }, null, 2));
console.log(`written ${file}`);
