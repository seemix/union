/**
 * Checks sitemaps and the SEO markup of every URL in them (stage 6).
 *
 *   node scripts/check-sitemap.ts <base> [--site ro|ru|all] [--host <Host>] [--concurrency N] [--limit N] [--verbose]
 *
 * `<base>` is the origin to test; `{site}` in it is replaced by `ro` / `ru`
 * (same conventions as scripts/check-redirects.ts):
 *   local    node scripts/check-sitemap.ts http://{site}.localhost:3000
 *   staging  node scripts/check-sitemap.ts https://next.{site}.baptist.org.md
 * `--limit N` checks only the first N URLs of each sitemap file (a quick smoke test).
 *
 * What is checked, per site:
 *   - `/sitemap_index.xml` lists `/sitemap/{id}.xml`; every file answers 200, is valid XML-ish
 *     (`<urlset>` with `<loc>`), has ≤ 5000 URLs, only absolute URLs of the production
 *     domain, no duplicates;
 *   - every URL, requested on `<base>` (origin swapped): status exactly 200 (a redirect or
 *     404 in a sitemap is a failure), no noindex (meta; also the X-Robots-Tag header on the
 *     production domain — staging/localhost send it on purpose), `<link rel="canonical">`
 *     equal to the URL itself, valid JSON-LD (`application/ld+json` parses; post pages carry
 *     NewsArticle + BreadcrumbList, home Organization + WebSite);
 *   - hreflang: present on the home page only.
 * Exit code: 0 — all passed, 1 — failures, 2 — usage error.
 *
 * Runs on plain Node ≥ 22.18 (type stripping); only erasable TS syntax here.
 */
import http from 'node:http';
import https from 'node:https';

const SITES = ['ro', 'ru'] as const;
type Site = (typeof SITES)[number];

const TIMEOUT_MS = 60_000;
const MAX_URLS_PER_SITEMAP = 5000;
const PROD = (site: Site) => `https://${site}.baptist.org.md`;

interface Reply {
  readonly status: number;
  readonly location: string | null;
  readonly robotsTag: string | null;
  readonly body: string;
}

function request(url: URL, hostHeader: string | null): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const secure = url.protocol === 'https:';
    const local = url.hostname.endsWith('.localhost');
    const req = (secure ? https : http).request(
      {
        method: 'GET',
        protocol: url.protocol,
        hostname: local ? '127.0.0.1' : url.hostname,
        port: url.port || (secure ? 443 : 80),
        path: url.pathname + url.search,
        headers: { host: hostHeader ?? url.host, 'user-agent': 'union-check-sitemap/1.0' },
        servername: url.hostname,
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            location: typeof res.headers.location === 'string' ? res.headers.location : null,
            robotsTag:
              typeof res.headers['x-robots-tag'] === 'string' ? res.headers['x-robots-tag'] : null,
            body: Buffer.concat(chunks).toString('utf8'),
          }),
        );
      },
    );
    req.on('timeout', () => req.destroy(new Error(`timeout after ${TIMEOUT_MS / 1000}s`)));
    req.on('error', reject);
    req.end();
  });
}

// ---------------------------------------------------------------- checks

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.trim());
}

const sameUrl = (a: string, b: string) => safeDecode(a) === safeDecode(b);
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? (m[2] ?? m[3] ?? null) : null;
}

function linkTags(html: string): string[] {
  return html.match(/<link\b[^>]*>/gi) ?? [];
}

/** Problems found in one page's HTML. `kind` is derived from the URL path. */
function checkHtml(url: string, reply: Reply, productionHost: boolean): string[] {
  const problems: string[] = [];
  const html = reply.body;
  const path = new URL(url).pathname;
  const kind =
    path === '/'
      ? 'home'
      : path.startsWith('/post/')
        ? 'post'
        : path.startsWith('/category/')
          ? 'category'
          : 'page';

  // Non-production hosts (staging, localhost) are noindex by design (src/proxy.ts).
  if (productionHost && reply.robotsTag && /noindex/i.test(reply.robotsTag))
    problems.push(`X-Robots-Tag: ${reply.robotsTag}`);
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (
      attr(m[0], 'name')?.toLowerCase() === 'robots' &&
      /noindex/i.test(attr(m[0], 'content') ?? '')
    ) {
      problems.push('meta robots noindex');
    }
  }

  const canonical = linkTags(html).find((t) => attr(t, 'rel')?.toLowerCase() === 'canonical');
  const href = canonical ? attr(canonical, 'href') : null;
  if (!href) problems.push('no canonical');
  else if (!sameUrl(href, url)) problems.push(`canonical ${href} ≠ ${url}`);

  const hreflang = linkTags(html).filter(
    (t) => attr(t, 'rel')?.toLowerCase() === 'alternate' && attr(t, 'hreflang'),
  );
  if (kind === 'home' && hreflang.length !== 2)
    problems.push(`home hreflang count ${hreflang.length}, expected 2 (ru, ro)`);
  if (kind !== 'home' && hreflang.length > 0) problems.push('hreflang outside the home page');

  for (const prop of ['og:title', 'og:description', 'og:image', 'og:url']) {
    const found = [...html.matchAll(/<meta\b[^>]*>/gi)].some(
      (m) => attr(m[0], 'property') === prop && attr(m[0], 'content'),
    );
    if (!found) problems.push(`missing ${prop}`);
  }
  if (!/<meta\b[^>]*name="twitter:card"/i.test(html)) problems.push('missing twitter:card');

  const types = new Set<string>();
  const blocks = [
    ...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
  ];
  for (const [, raw] of blocks) {
    try {
      const data = JSON.parse(raw!) as Record<string, unknown>;
      const nodes = Array.isArray(data['@graph'])
        ? (data['@graph'] as Record<string, unknown>[])
        : [data];
      if (data['@context'] !== 'https://schema.org')
        problems.push('JSON-LD without @context schema.org');
      for (const n of nodes) {
        types.add(String(n['@type']));
        if (n['@type'] === 'NewsArticle') {
          for (const key of [
            'headline',
            'image',
            'datePublished',
            'dateModified',
            'author',
            'publisher',
          ]) {
            if (!n[key]) problems.push(`NewsArticle without ${key}`);
          }
        }
        if (n['@type'] === 'BreadcrumbList') {
          const items = n.itemListElement as { position: number; name: string; item: string }[];
          if (!Array.isArray(items) || items.length < 2) problems.push('BreadcrumbList < 2 items');
          else
            items.forEach((it, i) => {
              if (it.position !== i + 1 || !it.name || !/^https:\/\//.test(it.item))
                problems.push(`BreadcrumbList item ${i + 1} invalid`);
            });
        }
      }
    } catch (e) {
      problems.push(`JSON-LD does not parse: ${(e as Error).message}`);
    }
  }
  const need: Record<string, string[]> = {
    home: ['Organization', 'WebSite'],
    post: ['NewsArticle', 'BreadcrumbList'],
    category: ['BreadcrumbList'],
    page: [],
  };
  for (const t of need[kind]!) if (!types.has(t)) problems.push(`missing JSON-LD ${t}`);
  return problems;
}

// ---------------------------------------------------------------- runner

async function pool<T>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]!);
    }),
  );
}

function usage(message?: string): never {
  if (message) console.error(`error: ${message}\n`);
  console.error(
    'usage: node scripts/check-sitemap.ts <base> [--site ro|ru|all] [--host <Host>] [--concurrency N] [--limit N] [--verbose]',
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith('--'));
if (!base) usage('missing <base>');
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? null : (args[i + 1] ?? usage(`${name} needs a value`));
};
const siteArg = opt('--site') ?? 'all';
if (siteArg !== 'all' && !(SITES as readonly string[]).includes(siteArg))
  usage(`unknown site "${siteArg}"`);
const sites: readonly Site[] = siteArg === 'all' ? SITES : [siteArg as Site];
const hostHeader = opt('--host');
const concurrency = Number(opt('--concurrency') ?? 6);
const limit = opt('--limit') === null ? Infinity : Number(opt('--limit'));
const verbose = args.includes('--verbose');

let failures = 0;
const fail = (site: Site, what: string, why: string) => {
  failures++;
  console.log(`  ✗ [${site}] ${what}\n      ${why}`);
};

for (const site of sites) {
  const origin = new URL(base.replace('{site}', site));
  const at = (path: string) => new URL(path, origin);
  console.log(`\n== ${site} (${origin.origin})`);

  let index: Reply;
  try {
    index = await request(at('/sitemap_index.xml'), hostHeader);
  } catch (e) {
    fail(site, '/sitemap_index.xml', (e as Error).message);
    continue;
  }
  if (index.status !== 200) {
    fail(site, '/sitemap_index.xml', `status ${index.status}`);
    continue;
  }
  const files = locs(index.body);
  console.log(`  index: ${files.length} sitemap file(s)`);

  const all: string[] = [];
  for (const file of files) {
    const path = new URL(file).pathname;
    if (new URL(file).origin !== PROD(site)) fail(site, file, `not on ${PROD(site)}`);
    const r = await request(at(path), hostHeader);
    if (r.status !== 200) {
      fail(site, path, `status ${r.status}`);
      continue;
    }
    const urls = locs(r.body);
    if (!r.body.includes('<urlset')) fail(site, path, 'no <urlset>');
    if (urls.length === 0) fail(site, path, 'empty sitemap');
    if (urls.length > MAX_URLS_PER_SITEMAP)
      fail(site, path, `${urls.length} URLs > ${MAX_URLS_PER_SITEMAP}`);
    for (const u of urls)
      if (!u.startsWith(`${PROD(site)}/`)) fail(site, u, `not on ${PROD(site)}`);
    console.log(`  ${path}: ${urls.length} URLs`);
    all.push(...urls.slice(0, limit));
  }

  const unique = new Set(all);
  if (unique.size !== all.length)
    fail(site, 'sitemaps', `${all.length - unique.size} duplicate URL(s)`);

  let checked = 0;
  await pool([...unique], concurrency, async (url) => {
    const u = new URL(url);
    let r: Reply;
    try {
      r = await request(at(u.pathname + u.search), hostHeader);
    } catch (e) {
      fail(site, url, (e as Error).message);
      return;
    }
    checked++;
    if (r.status !== 200) {
      fail(site, url, r.location ? `status ${r.status} → ${r.location}` : `status ${r.status}`);
      return;
    }
    for (const problem of checkHtml(url, r, origin.origin === PROD(site))) fail(site, url, problem);
    if (verbose) console.log(`  ✓ ${url}`);
    if (checked % 200 === 0) console.log(`  … ${checked}/${unique.size}`);
  });
  console.log(`  checked ${checked} URL(s)`);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} problem(s).`);
process.exit(failures === 0 ? 0 : 1);
