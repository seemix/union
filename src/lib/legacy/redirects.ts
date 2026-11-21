/**
 * Legacy URL redirects (stage 5, Q5). Only the old front-end's own formats:
 *   /post?id=N                → 301 /post/N-{slug}
 *   /page?id=N                → 301 /page/{slug}
 *   /category?id=N[&page=P]   → 301 /category/{slug}[/P]
 *   /search?query=…[&page=P]  → 301 /search?q=…[&page=P]
 * Old WordPress URLs (`?p=`, `/2023/05/…`) are not redirected.
 *
 * Other query parameters (utm_*, …) are kept, `fbclid` is dropped.
 * Unknown id → 404 (no redirect). WP failure: a post goes to `/post/N` with a temporary
 * redirect (the post page itself redirects to the canonical URL); a page/category,
 * which has no id route, gets 503.
 */
import type { SiteId } from '@/config/sites';
import { normalizeQuery } from '@/lib/search/query';
import { categoryHref, pageHref, postHref, searchHref } from '@/lib/site/href';
import type { LegacyKind, LookupFn } from './lookup';

export type LegacyAction =
  | { readonly type: 'redirect'; readonly location: string; readonly status: 301 | 302 }
  | { readonly type: 'not_found' }
  | { readonly type: 'unavailable' };

/** Parameters removed from every legacy redirect. */
const DROPPED_PARAMS = new Set(['fbclid']);

const ID = /^\d{1,15}$/;
const PAGE = /^\d{1,9}$/;

function parseId(raw: string | null): number | null {
  if (raw === null || !ID.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Old `&page=`: anything but a number ≥ 2 means page 1. */
function parsePage(raw: string | null): number {
  if (raw === null || !PAGE.test(raw)) return 1;
  return Math.max(1, Number(raw));
}

/** `path` (may already hold `?q=…`) + the remaining params, in their original order. */
function withRest(path: string, params: URLSearchParams, consumed: readonly string[]): string {
  const rest = new URLSearchParams();
  for (const [name, value] of params) {
    if (consumed.includes(name) || DROPPED_PARAMS.has(name)) continue;
    rest.append(name, value);
  }
  const qs = rest.toString();
  if (!qs) return path;
  return `${path}${path.includes('?') ? '&' : '?'}${qs}`;
}

const LEGACY_PATHS: Readonly<Record<string, LegacyKind | 'search'>> = {
  '/post': 'post',
  '/page': 'page',
  '/category': 'category',
  '/search': 'search',
};

/**
 * Decides what to do with a request. `null` → not a legacy URL, continue as usual
 * (e.g. `/search?q=`, `/post` without `id`).
 */
export async function resolveLegacy(
  pathname: string,
  params: URLSearchParams,
  site: SiteId,
  lookup: LookupFn,
): Promise<LegacyAction | null> {
  const kind = LEGACY_PATHS[pathname];
  if (!kind) return null;

  if (kind === 'search') {
    if (!params.has('query')) return null;
    // A new-style `q` (if somehow both are present) wins over the old `query`.
    const q = normalizeQuery(params.get('q') ?? params.get('query') ?? '');
    const page = parsePage(params.get('page'));
    return {
      type: 'redirect',
      status: 301,
      location: withRest(searchHref(q, q ? page : 1), params, ['query', 'q', 'page']),
    };
  }

  if (!params.has('id')) return null;
  const id = parseId(params.get('id'));
  if (id === null) return { type: 'not_found' };

  const found = await lookup(site, kind, id);

  if (found.status === 'not_found') return { type: 'not_found' };
  if (found.status === 'error') {
    if (kind !== 'post') return { type: 'unavailable' };
    return { type: 'redirect', status: 302, location: withRest(`/post/${id}`, params, ['id']) };
  }

  const { slug } = found;
  switch (kind) {
    case 'post':
      return { type: 'redirect', status: 301, location: withRest(postHref({ id, slug }), params, ['id']) };
    case 'page':
      return { type: 'redirect', status: 301, location: withRest(pageHref({ slug }), params, ['id']) };
    case 'category': {
      const page = parsePage(params.get('page'));
      return {
        type: 'redirect',
        status: 301,
        location: withRest(categoryHref({ slug }, page), params, ['id', 'page']),
      };
    }
  }
}
