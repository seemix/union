// Debug helper: why is LCP slow on one URL? `node scripts/lh-detail.mjs <url> [v2]`
import lighthouse from 'lighthouse';
import * as cl from 'chrome-launcher';
import path from 'node:path';
import fs from 'node:fs';
const [url, v2] = process.argv.slice(2);
const base = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
const dir = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const chrome = await cl.launch({ chromePath: path.join(base, dir, 'chrome-win64', 'chrome.exe'), chromeFlags: ['--headless=new', '--ignore-certificate-errors', ...(v2 ? ['--host-resolver-rules=MAP ru.baptist.org.md 127.0.0.1:3443,MAP ro.baptist.org.md 127.0.0.1:3443'] : [])] });
const { lhr } = await lighthouse(url, { port: chrome.port, logLevel: 'error', onlyCategories: ['performance'] });
await chrome.kill();
const a = lhr.audits;
console.log('LCP', a['largest-contentful-paint'].displayValue, JSON.stringify(a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? ''));
for (const it of a['largest-contentful-paint-element']?.details?.items?.[1]?.items ?? []) console.log(' phase', it.phase, Math.round(it.timing));
for (const id of ['render-blocking-resources', 'unused-javascript', 'lcp-discovery-insight', 'network-dependency-tree-insight', 'font-display', 'bootup-time', 'mainthread-work-breakdown']) {
  const x = a[id]; if (x) console.log(id, x.score, x.displayValue ?? '');
}
console.log((a['network-requests'].details.items).filter((r) => r.transferSize > 60000).map((r) => `${Math.round(r.transferSize / 1024)}KB ${Math.round(r.networkEndTime - r.networkRequestTime)}ms ${r.url.slice(0, 110)}`).join('\n'));
const chain = a['network-dependency-tree-insight']?.details;
if (chain) console.log(JSON.stringify(chain).slice(0, 1200));
for (const id of ['lcp-breakdown-insight', 'lcp-discovery-insight']) console.log(id, JSON.stringify(a[id]?.details ?? a[id] ?? null)?.slice(0, 1500));
console.log(JSON.stringify(a["largest-contentful-paint-element"]?.details ?? null)?.slice(0, 1200));
