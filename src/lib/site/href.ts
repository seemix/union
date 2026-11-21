import type { ContentTarget } from '@/config/sites';

/**
 * Route of a config-referenced WP entity. Uses the legacy `?id=` form (slugs are not
 * in the config); `src/proxy.ts` 301-redirects it to the slug route (stage 5).
 */
export function targetHref(target: ContentTarget): string {
  return `/${target.kind}?id=${target.id}`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // Malformed escape (`%zz`, lone `%`): compare it as is.
    return value;
  }
}

export interface UrlSlug {
  /** Percent-encoded slug for hrefs, `Location` and canonical; `''` when WP has none. */
  readonly slug: string;
  /** Whether the slug taken from the URL is the same slug (only when `fromUrl` is given). */
  readonly matches: boolean;
}

/**
 * The single place for WP slug ↔ URL (Q4). ru slugs stay Cyrillic: WP stores them
 * percent-encoded (`%d0%bf…`), the URL may carry them encoded or decoded (and in any
 * hex case), so both sides are compared after `decodeURIComponent`. The emitted form
 * is always `encodeURIComponent(decoded)` — one stable spelling per slug.
 *
 * Comparison is exact otherwise: `Some-Post` ≠ `some-post`, `''` ≠ `slug` → canonical redirect.
 */
export function slugForUrl(wpSlug: string, fromUrl?: string | null): UrlSlug {
  const decoded = safeDecode(wpSlug);
  return {
    slug: decoded ? encodeURIComponent(decoded) : '',
    matches: fromUrl !== undefined && safeDecode(fromUrl ?? '') === decoded,
  };
}

/**
 * Canonical post route `/post/{id}-{slug}` (Q3), slug encoded by `slugForUrl()`;
 * an empty slug falls back to `/post/{id}`.
 */
export function postHref(post: { readonly id: number; readonly slug: string }): string {
  const { slug } = slugForUrl(post.slug);
  return slug ? `/post/${post.id}-${slug}` : `/post/${post.id}`;
}

/** Page route `/page/{slug}` (Q6), slug encoded by `slugForUrl()`. */
export function pageHref(page: { readonly slug: string }): string {
  return `/page/${slugForUrl(page.slug).slug}`;
}

/**
 * Category route `/category/{slug}` or, for `page` > 1, `/category/{slug}/{page}`.
 * Page 1 has no number (`/category/x/1` redirects to `/category/x`).
 */
export function categoryHref(category: { readonly slug: string }, page = 1): string {
  const base = `/category/${slugForUrl(category.slug).slug}`;
  return page > 1 ? `${base}/${page}` : base;
}

export interface ListPage {
  /** 1-based page number. */
  readonly page: number;
  /** `false` → not the canonical spelling (`/1`, `/02`): redirect to the canonical URL. */
  readonly canonical: boolean;
}

/**
 * Parses the `[[...page]]` segments of a paginated list: none → page 1, `['2']` → page 2.
 * `null` → 404 (not a number, `0`, extra segments).
 */
export function parseListPage(segments: readonly string[] | undefined): ListPage | null {
  if (!segments || segments.length === 0) return { page: 1, canonical: true };
  if (segments.length > 1) return null;
  const raw = segments[0]!;
  if (!/^\d{1,9}$/.test(raw)) return null;
  const page = Number(raw);
  if (page < 1) return null;
  return { page, canonical: page > 1 && raw === String(page) };
}

export interface PostIdSlug {
  readonly id: number;
  /** Digits exactly as in the URL (`007` ≠ `7`, which makes the URL non-canonical). */
  readonly rawId: string;
  /** Text after the first `-`; `null` when there is no `-`. */
  readonly slug: string | null;
}

// 15 digits keep the id a safe integer.
const ID_SLUG = /^(\d{1,15})(?:-([\s\S]*))?$/;

/** Parses the `[idSlug]` segment (`113186-slug`, `113186`). `null` → 404. */
export function parsePostIdSlug(idSlug: string): PostIdSlug | null {
  const m = ID_SLUG.exec(idSlug);
  if (!m) return null;
  const id = Number(m[1]);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return { id, rawId: m[1]!, slug: m[2] ?? null };
}

/**
 * Search route `/search?q=…` (`&page=n` for n > 1). The query is always passed through
 * `encodeURIComponent`; an empty query gives the bare `/search`.
 */
export function searchHref(query: string, page = 1): string {
  if (!query) return '/search';
  const base = `/search?q=${encodeURIComponent(query)}`;
  return page > 1 ? `${base}&page=${page}` : base;
}
