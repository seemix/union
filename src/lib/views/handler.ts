/**
 * `POST /api/views/<id>` (Q10): counts one post view in WP through the mu-plugin
 * (`baptist/v1/views/{id}`, wp/README.md), without exposing its secret to the browser.
 *
 *   browser ─sendBeacon→ Next (site from `x-site`, bot filter, rate limit) ─secret→ WP
 *
 * Every accepted request answers 204 with no body, whether the view was counted or not:
 * a client cannot learn about bots/rate limits/WP state, and `sendBeacon` ignores it anyway.
 */
import { getSite, isSiteId, type SiteId } from '@/config/sites';
import { SITE_HEADER } from '@/lib/site/header';
import { buildWpUrl } from '@/lib/wp/client';
import { isBot, isPrefetch } from './bots';
import { TtlCache } from '@/lib/cache/ttl-cache';
import { WindowCounter } from './window-counter';

/** One counted view per IP + post per this window. */
export const VIEW_WINDOW_MS = 30 * 60 * 1000;
/** ~100 bytes per entry → a few MB at most. */
export const VIEW_LIMITER_MAX = 50_000;
export const VIEWS_WP_TIMEOUT_MS = 5_000;

/** Same rule as the mu-plugin (`absint` + no leading zeros), plus a sane upper bound. */
const ID_RE = /^[1-9]\d{0,9}$/;

export function viewsSecretEnv(site: SiteId): string {
  return `VIEWS_SECRET_${site.toUpperCase()}`;
}

/** `https://…/?rest_route=/wp/v2/` or `…/wp-json/wp/v2/` → the same base for `baptist/v1/`. */
export function viewsUrl(site: SiteId, id: number): string {
  const restBase = getSite(site).wp.restBase;
  const base = restBase.replace(/wp\/v2\/?$/, 'baptist/v1/');
  if (base === restBase) throw new Error(`[views] Unexpected WP restBase for ${site}: ${restBase}`);
  return buildWpUrl(base, `views/${id}`);
}

/**
 * Global ceiling per post, whatever the client address: spoofed proxy headers can mint a new
 * "IP" per request, this caps what that buys. Far above real traffic of a single post.
 */
export const POST_VIEWS_PER_WINDOW = 60;
export const POST_WINDOW_MS = 60 * 1000;
const POST_WINDOW_MAX_KEYS = 10_000;

/** Header that carries the client address when `CLIENT_IP_HEADER` is not set. */
export const DEFAULT_CLIENT_IP_HEADER = 'x-forwarded-for';

/** Loose shape check: IPv4 / IPv6 characters only, so garbage cannot become a key. */
const IP_SHAPE = /^[0-9a-f.:]{2,45}$/i;

/**
 * Client address for the rate-limit key. Behind cPanel's Apache/LiteSpeed the socket peer is
 * the web server, so the address comes from a proxy header — only the one named by
 * `CLIENT_IP_HEADER` (default `x-forwarded-for`). Headers the hosting never sets
 * (`X-Real-IP`, `CF-Connecting-IP`) are ignored: a client could put anything there.
 * In `X-Forwarded-For` the right-most entry is used: it is appended by the proxy closest to us,
 * whereas the left-most one is whatever the client sent. If the hosting does not append at all,
 * the value is still client-controlled; `POST_VIEWS_PER_WINDOW` bounds that case.
 * Without a usable address, the User-Agent stands in so that such visitors do not share one bucket.
 */
export function clientKey(headers: Headers, ipHeader = DEFAULT_CLIENT_IP_HEADER): string {
  const raw = headers.get(ipHeader);
  const ip = raw?.split(',').at(-1)?.trim();
  return ip && IP_SHAPE.test(ip)
    ? `ip:${ip.toLowerCase()}`
    : `ua:${headers.get('user-agent') ?? ''}`;
}

export interface ViewsHandlerOptions {
  /** IP + post keys counted within `VIEW_WINDOW_MS`. */
  readonly limiter?: TtlCache<true>;
  readonly postLimiter?: WindowCounter;
  readonly fetch?: typeof fetch;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly timeoutMs?: number;
}

const noContent = () =>
  new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
const plain = (status: number, text: string) =>
  new Response(text, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export function createViewsHandler({
  limiter = new TtlCache<true>(VIEW_LIMITER_MAX),
  postLimiter = new WindowCounter(POST_VIEWS_PER_WINDOW, POST_WINDOW_MS, POST_WINDOW_MAX_KEYS),
  fetch: fetchImpl = (...args) => fetch(...args),
  env = process.env,
  timeoutMs = VIEWS_WP_TIMEOUT_MS,
}: ViewsHandlerOptions = {}) {
  const warned = new Set<SiteId>();
  const ipHeader = env.CLIENT_IP_HEADER?.trim().toLowerCase() || DEFAULT_CLIENT_IP_HEADER;

  return async function POST(request: Request, idParam: string): Promise<Response> {
    const site = request.headers.get(SITE_HEADER);
    // Set by proxy.ts for every known host; absent only if the proxy did not run.
    if (!site || !isSiteId(site)) return plain(404, 'Not Found');
    if (!ID_RE.test(idParam)) return plain(400, 'Invalid id');
    const id = Number(idParam);

    const { headers } = request;
    if (isBot(headers.get('user-agent')) || isPrefetch(headers)) return noContent();
    // sendBeacon from our page is same-origin; other sites must not drive our counter.
    const fetchSite = headers.get('sec-fetch-site');
    if (fetchSite && fetchSite !== 'same-origin') return noContent();

    const secret = env[viewsSecretEnv(site)]?.trim();
    if (!secret) {
      if (!warned.has(site)) {
        warned.add(site);
        console.error(`[views] ${viewsSecretEnv(site)} is not set: views are not counted`);
      }
      return noContent();
    }

    const key = `${site}:${id}:${clientKey(headers, ipHeader)}`;
    const postKey = `${site}:${id}`;
    // Marked before the WP call so parallel duplicates are dropped too (check + set run
    // synchronously, so two parallel requests cannot both pass).
    if (limiter.get(key)) return noContent();
    limiter.set(key, true, VIEW_WINDOW_MS);
    // Over the per-post ceiling: the IP slot stays used, so the client does not retry at once.
    if (!postLimiter.take(postKey)) return noContent();
    const release = () => {
      limiter.delete(key); // let the next visit try again
      postLimiter.refund(postKey);
    };

    try {
      const res = await fetchImpl(viewsUrl(site, id), {
        method: 'POST',
        headers: { 'X-Union-Secret': secret, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });
      await res.body?.cancel();
      if (res.status === 404) return noContent(); // not a published post: nothing to count
      if (!res.ok) {
        release();
        console.error(`[views] WP ${site} answered ${res.status} for post ${id}`);
      }
    } catch (err) {
      release();
      console.error(
        `[views] WP ${site} request for post ${id} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
    return noContent();
  };
}
