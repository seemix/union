/**
 * id → slug lookup for legacy redirects (`/post?id=`, `/page?id=`, `/category?id=`).
 *
 * Runs inside `src/proxy.ts`. Next 16 does not cache anything there: `use cache` has no
 * effect in Proxy and `fetch` cache options (`next.revalidate`, `next.tags`) are ignored
 * (node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md, "Limitations").
 * So the cached getters of `@/lib/wp/api` cannot be reused here; this module has its own
 * bounded in-memory LRU with TTL, plus de-duplication of parallel requests for one id.
 * The Next cache applies one step later, on the slug route the redirect points to.
 *
 * Staleness: a renamed post is harmless (the post page 308s to its new slug); a renamed
 * page/category gives a 404 until the entry expires (`FOUND_TTL_MS`).
 */
import type { SiteId } from '@/config/sites';
import { wpRequest, type WpResult } from '@/lib/wp/client';
import type { WpPostIdSlug } from '@/lib/wp/types';
import { TtlCache } from './ttl-cache';

export type LegacyKind = 'post' | 'page' | 'category';

export type SlugLookup =
  | { readonly status: 'found'; readonly slug: string }
  | { readonly status: 'not_found' }
  | { readonly status: 'error' };

export type LookupFn = (site: SiteId, kind: LegacyKind, id: number) => Promise<SlugLookup>;

export const FOUND_TTL_MS = 60 * 60 * 1000;
export const NOT_FOUND_TTL_MS = 5 * 60 * 1000;
export const LOOKUP_MAX_ENTRIES = 2000;
/** Proxy blocks the response: fail fast (the client retries once on 5xx). */
export const LOOKUP_TIMEOUT_MS = 3000;

const ENDPOINT: Record<LegacyKind, string> = {
  post: 'posts',
  page: 'pages',
  category: 'categories',
};

export type WpIdSlugRequest = (
  site: SiteId,
  path: string,
) => Promise<WpResult<WpPostIdSlug>>;

const defaultRequest: WpIdSlugRequest = (site, path) =>
  wpRequest<WpPostIdSlug>(site, path, { _fields: ['id', 'slug'] }, { timeoutMs: LOOKUP_TIMEOUT_MS });

function toLookup(kind: LegacyKind, r: WpResult<WpPostIdSlug>): SlugLookup {
  if (r.status === 'not_found') return { status: 'not_found' };
  if (r.status === 'error') {
    // Anonymous GET of a draft/private/trashed post or page: 401/403 `rest_forbidden`.
    // For a public site it does not exist (same rule as `forbiddenAsNotFound` in api.ts).
    const { status, code } = r.error;
    if ((status === 401 || status === 403) && code === 'rest_forbidden' && kind !== 'category') {
      return { status: 'not_found' };
    }
    return { status: 'error' };
  }
  const slug = typeof r.data?.slug === 'string' ? r.data.slug : null;
  if (slug === null) return { status: 'error' };
  // A post without slug still has `/post/{id}`; a page/category route needs one.
  if (slug === '' && kind !== 'post') return { status: 'not_found' };
  return { status: 'found', slug };
}

export interface SlugLookupOptions {
  readonly request?: WpIdSlugRequest;
  readonly maxEntries?: number;
  readonly now?: () => number;
}

export function createSlugLookup({
  request = defaultRequest,
  maxEntries = LOOKUP_MAX_ENTRIES,
  now = Date.now,
}: SlugLookupOptions = {}): LookupFn {
  const cache = new TtlCache<SlugLookup>(maxEntries, now);
  const inFlight = new Map<string, Promise<SlugLookup>>();

  return async (site, kind, id) => {
    const key = `${site}:${kind}:${id}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const pending = inFlight.get(key);
    if (pending) return pending;

    const promise = (async (): Promise<SlugLookup> => {
      try {
        const result = toLookup(kind, await request(site, `${ENDPOINT[kind]}/${id}`));
        // Errors are never cached: the next request retries WP.
        if (result.status === 'found') cache.set(key, result, FOUND_TTL_MS);
        else if (result.status === 'not_found') cache.set(key, result, NOT_FOUND_TTL_MS);
        return result;
      } catch {
        return { status: 'error' };
      } finally {
        inFlight.delete(key);
      }
    })();
    inFlight.set(key, promise);
    return promise;
  };
}

/** Process-wide instance used by the proxy. */
export const lookupSlug: LookupFn = createSlugLookup();
