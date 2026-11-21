/**
 * Smoke test for 301 redirects of legacy URLs (P5.2, Q5).
 *
 *   node scripts/check-redirects.ts <base> [--site ro|ru|all] [--host <Host>] [--concurrency N] [--verbose]
 *
 * `<base>` is the origin to test; `{site}` in it is replaced by `ro` / `ru`:
 *   local    node scripts/check-redirects.ts http://{site}.localhost:3000
 *   staging  node scripts/check-redirects.ts https://next.{site}.baptist.org.md
 *   prod     node scripts/check-redirects.ts https://{site}.baptist.org.md
 * Without `{site}` the base is used for every site; `--host` then sets the `Host` header
 * (e.g. `SITE_OVERRIDE=ro npm run dev` + `http://localhost:3000 --site ro`).
 * `*.localhost` always connects to 127.0.0.1 (does not depend on the OS resolver).
 *
 * Input: `scripts/redirects.{ro,ru}.txt` — old URLs of the live sites; only the path and
 * query are used, the origin comes from `<base>`. Rules per URL:
 *   - old format (`/post?id=`, `/page?id=`, `/category?id=[&page=]`, `/search?query=`):
 *     step 1 is a 301 to the expected new format, the final answer is 200, ≤ 2 hops;
 *   - `/`: 200 straight away, no redirect;
 *   - `404 <url>` lines: no redirect, 404.
 * Exit code: 0 — all passed, 1 — there are failures, 2 — usage / input error.
 *
 * Runs on plain Node ≥ 22.18 (type stripping, no build step); only erasable TS syntax here.
 */
import { readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const SITES = ['ro', 'ru'] as const;
type Site = (typeof SITES)[number];
type Kind = 'home' | 'post' | 'page' | 'category' | 'search' | 'other';
type Expect = 'redirect' | 'not_found';

const MAX_HOPS = 2;
const TIMEOUT_MS = 20_000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

interface Entry {
  readonly site: Site;
  readonly file: string;
  readonly lineNo: number;
  readonly expect: Expect;
  readonly kind: Kind;
  /** Old URL from the list (origin is irrelevant, path + query are used). */
  readonly source: URL;
}

interface Step {
  readonly url: string;
  readonly status: number;
  readonly location: string | null;
}

interface Result {
  readonly entry: Entry;
  readonly steps: readonly Step[];
  readonly finalUrl: string;
  readonly finalStatus: number | null;
  readonly problems: readonly string[];
}

interface Options {
  readonly base: string;
  readonly sites: readonly Site[];
  readonly host: string | null;
  readonly concurrency: number;
  readonly verbose: boolean;
}

class UsageError extends Error {}

// ---------------------------------------------------------------- arguments

function parseArgs(argv: readonly string[]): Options {
  let base: string | null = null;
  let sites: readonly Site[] = SITES;
  let host: string | null = null;
  let concurrency = 4;
  let verbose = false;

  const value = (i: number, flag: string): string => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new UsageError(`${flag} needs a value`);
    return v;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    switch (arg) {
      case '--site': {
        const v = value(i++, arg);
        if (v === 'all') sites = SITES;
        else if ((SITES as readonly string[]).includes(v)) sites = [v as Site];
        else throw new UsageError(`--site must be ro, ru or all (got "${v}")`);
        break;
      }
      case '--host':
        host = value(i++, arg);
        break;
      case '--concurrency': {
        const n = Number(value(i++, arg));
        if (!Number.isInteger(n) || n < 1 || n > 32)
          throw new UsageError('--concurrency must be 1..32');
        concurrency = n;
        break;
      }
      case '--verbose':
      case '-v':
        verbose = true;
        break;
      case '--help':
      case '-h':
        throw new UsageError('');
      default:
        if (arg.startsWith('-')) throw new UsageError(`unknown option ${arg}`);
        if (base !== null) throw new UsageError(`unexpected argument "${arg}"`);
        base = arg;
    }
  }
  if (base === null) throw new UsageError('base URL is required');
  return { base, sites, host, concurrency, verbose };
}

const USAGE = `Usage: node scripts/check-redirects.ts <base> [--site ro|ru|all] [--host <Host>] [--concurrency N] [--verbose]

  <base>   origin to test; "{site}" is replaced by ro / ru
           http://{site}.localhost:3000        local
           https://next.{site}.baptist.org.md  staging
           https://{site}.baptist.org.md       production
  --host   Host header for a base without "{site}" (local run with SITE_OVERRIDE)
`;

function baseFor(options: Options, site: Site): URL {
  const raw = options.base.replaceAll('{site}', site);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UsageError(`"${options.base}" is not a valid URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UsageError(`base must be http(s), got "${url.protocol}"`);
  }
  return new URL(url.origin);
}

// ---------------------------------------------------------------- list files

function kindOf(pathname: string): Kind {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  switch (path) {
    case '/':
      return 'home';
    case '/post':
    case '/page':
    case '/category':
    case '/search':
      return path.slice(1) as Kind;
    default:
      return 'other';
  }
}

function loadEntries(site: Site): Entry[] {
  const file = fileURLToPath(new URL(`./redirects.${site}.txt`, import.meta.url));
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    throw new UsageError(`cannot read ${file}: ${(error as Error).message}`);
  }

  const entries: Entry[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) return;

    const m = /^(?:(404)\s+)?(\S+)$/.exec(line);
    if (!m) throw new UsageError(`${file}:${index + 1}: cannot parse "${raw}"`);
    let source: URL;
    try {
      source = new URL(m[2]!);
    } catch {
      throw new UsageError(`${file}:${index + 1}: "${m[2]}" is not an absolute URL`);
    }
    const kind = kindOf(source.pathname);
    if (kind === 'other') {
      throw new UsageError(
        `${file}:${index + 1}: "${source.pathname}" is not a known old URL format`,
      );
    }
    entries.push({
      site,
      file,
      lineNo: index + 1,
      expect: m[1] ? 'not_found' : 'redirect',
      kind,
      source,
    });
  });

  if (entries.length === 0) throw new UsageError(`${file}: no URLs`);
  return entries;
}

// ---------------------------------------------------------------- HTTP

interface Response {
  readonly status: number;
  readonly location: string | null;
}

/** One request, redirects are NOT followed. `*.localhost` connects to 127.0.0.1. */
function request(url: URL, hostHeader: string | null): Promise<Response> {
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
        headers: {
          host: hostHeader ?? url.host,
          'user-agent': 'union-check-redirects/1.0',
          accept: 'text/html',
        },
        // A TLS certificate is checked against the real host, not 127.0.0.1.
        servername: url.hostname,
        timeout: TIMEOUT_MS,
      },
      (res) => {
        res.resume(); // the body is not needed
        const location = res.headers.location;
        resolve({
          status: res.statusCode ?? 0,
          location: typeof location === 'string' ? location : null,
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error(`timeout after ${TIMEOUT_MS / 1000}s`)));
    req.on('error', reject);
    req.end();
  });
}

// ---------------------------------------------------------------- expectations

/** `&page=`: anything but a number ≥ 2 is page 1 (same rule as src/lib/legacy/redirects.ts). */
function pageOf(params: URLSearchParams): number {
  const raw = params.get('page');
  return raw !== null && /^\d{1,9}$/.test(raw) ? Math.max(1, Number(raw)) : 1;
}

const CONSUMED: Readonly<Record<Kind, readonly string[]>> = {
  home: [],
  post: ['id'],
  page: ['id'],
  category: ['id', 'page'],
  search: ['query', 'q', 'page'],
  other: [],
};

/** What the first `Location` must look like; `null` — fine, otherwise the reason. */
function locationProblem(entry: Entry, location: URL): string | null {
  const params = entry.source.searchParams;
  const path = location.pathname;
  let shape: string | null = null;

  switch (entry.kind) {
    case 'post': {
      const id = params.get('id') ?? '';
      const m = /^\/post\/(\d+)-[^/]+$/.exec(path);
      if (!m || m[1] !== id) shape = `/post/${id}-<slug>`;
      break;
    }
    case 'page':
      if (!/^\/page\/[^/]+$/.test(path)) shape = '/page/<slug>';
      break;
    case 'category': {
      const page = pageOf(params);
      const pattern = page > 1 ? new RegExp(`^/category/[^/]+/${page}$`) : /^\/category\/[^/]+$/;
      if (!pattern.test(path)) shape = page > 1 ? `/category/<slug>/${page}` : '/category/<slug>';
      break;
    }
    case 'search': {
      const q = (params.get('query') ?? '').trim();
      const page = pageOf(params);
      if (path !== '/search') shape = '/search?q=…';
      else if (q && location.searchParams.get('q') !== q)
        shape = `/search?q=${encodeURIComponent(q)}`;
      else if (q && page > 1 && location.searchParams.get('page') !== String(page)) {
        shape = `/search?q=…&page=${page}`;
      } else if (page === 1 && location.searchParams.has('page'))
        shape = '/search?q=… (without page)';
      break;
    }
    default:
      return null;
  }
  if (shape) return `first Location is "${location.pathname}${location.search}", expected ${shape}`;

  // Other parameters survive (utm_*), `fbclid` is dropped.
  const consumed = CONSUMED[entry.kind];
  for (const [name, value] of params) {
    if (consumed.includes(name)) continue;
    if (name === 'fbclid') {
      if (location.searchParams.has('fbclid')) return 'fbclid must be dropped from the redirect';
    } else if (location.searchParams.get(name) !== value) {
      return `query parameter "${name}" was lost in the redirect`;
    }
  }
  return null;
}

// ---------------------------------------------------------------- one URL

async function check(entry: Entry, base: URL, hostHeader: string | null): Promise<Result> {
  const steps: Step[] = [];
  const problems: string[] = [];
  let current = new URL(entry.source.pathname + entry.source.search, base);
  let finalStatus: number | null = null;
  const seen = new Set<string>();

  for (;;) {
    if (seen.has(current.href)) {
      problems.push('redirect loop');
      break;
    }
    seen.add(current.href);

    let res: Response;
    try {
      res = await request(current, hostHeader);
    } catch (error) {
      problems.push(`request failed: ${(error as Error).message || String(error)}`);
      break;
    }

    if (!REDIRECT_STATUSES.has(res.status)) {
      steps.push({ url: current.href, status: res.status, location: null });
      finalStatus = res.status;
      break;
    }
    steps.push({ url: current.href, status: res.status, location: res.location });
    if (!res.location) {
      problems.push(`${res.status} without Location`);
      break;
    }

    let next: URL;
    try {
      next = new URL(res.location, current);
    } catch {
      problems.push(`unparsable Location "${res.location}"`);
      break;
    }
    // An absolute Location on another origin is a bug in a proxied deployment
    // (e.g. `http://localhost:3000/...` behind Passenger), not something to follow.
    if (next.origin !== base.origin) {
      problems.push(`Location leaves the tested origin: ${res.location}`);
      break;
    }

    if (steps.length === 1) {
      if (res.status !== 301) problems.push(`first step is ${res.status}, expected 301`);
      else {
        const wrong = locationProblem(entry, next);
        if (wrong) problems.push(wrong);
      }
    }
    if (steps.length > MAX_HOPS) {
      problems.push(`more than ${MAX_HOPS} hops`);
      break;
    }
    current = next;
  }

  const hops = steps.filter((s) => s.location !== null).length;
  if (finalStatus !== null && problems.length === 0) {
    if (entry.expect === 'not_found') {
      if (hops > 0) problems.push(`expected no redirect, got ${hops}`);
      if (finalStatus !== 404) problems.push(`final status ${finalStatus}, expected 404`);
    } else {
      if (entry.kind !== 'home' && hops === 0)
        problems.push(`no redirect (status ${finalStatus}), expected 301`);
      if (entry.kind === 'home' && hops > 0) problems.push(`home must not redirect (${hops} hops)`);
      if (finalStatus !== 200) problems.push(`final status ${finalStatus}, expected 200`);
    }
  }

  return { entry, steps, finalUrl: current.href, finalStatus, problems };
}

// ---------------------------------------------------------------- run + report

async function pool<T, R>(
  items: readonly T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: number, text: string) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
const green = (t: string) => paint(32, t);
const red = (t: string) => paint(31, t);
const dim = (t: string) => paint(2, t);

function describe(result: Result): string {
  const base = new URL(result.finalUrl).origin;
  const rel = (u: string) => (u.startsWith(base) ? u.slice(base.length) || '/' : u);
  const chain = result.steps.map((s) =>
    `${s.status} ${s.location ? rel(new URL(s.location, s.url).href) : ''}`.trim(),
  );
  return chain.length ? chain.join(' → ') : '(no response)';
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2));
  const started = Date.now();
  let total = 0;
  let failed = 0;

  for (const site of options.sites) {
    const base = baseFor(options, site);
    const hostHeader = options.host;
    const entries = loadEntries(site);
    console.log(
      `\n${site.toUpperCase()}  ${base.origin}${hostHeader ? `  (Host: ${hostHeader})` : ''}  ${entries.length} URLs`,
    );

    const results = await pool(entries, options.concurrency, (e) => check(e, base, hostHeader));
    for (const r of results) {
      total++;
      const path = r.entry.source.pathname + r.entry.source.search;
      if (r.problems.length === 0) {
        console.log(`  ${green('✓')} ${path}${options.verbose ? `  ${dim(describe(r))}` : ''}`);
      } else {
        failed++;
        console.log(`  ${red('✗')} ${path}  ${dim(describe(r))}`);
        for (const p of r.problems) console.log(`      ${red('-')} ${p}`);
      }
    }
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const summary = `${total - failed}/${total} passed, ${failed} failed (${seconds}s)`;
  console.log(`\n${failed === 0 ? green(summary) : red(summary)}`);
  return failed === 0 ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    if (error instanceof UsageError) {
      if (error.message) console.error(`Error: ${error.message}\n`);
      console.error(USAGE);
      process.exitCode = 2;
    } else {
      console.error(error);
      process.exitCode = 2;
    }
  },
);
