/**
 * Cached WP getters (Next 16 Cache Components: `use cache` + `cacheLife` + `cacheTag`).
 *
 * Each getter = an uncached wrapper (validates/normalizes input, unwraps the result)
 * around a `use cache` function that returns a serializable `WpResult`.
 * Lifetimes by outcome (one `cacheLife` call per invocation):
 *   ok → `hours` (entities) / `minutes` (lists, search) · not found → `minutes` · error → `seconds`
 * so a WP outage is never cached for long. Tags: see ./tags.ts.
 *
 * Return: data, or `null` when WP has no such content (→ `notFound()`); other failures throw `WpError`.
 */
import { cacheLife, cacheTag } from 'next/cache';
import type { SiteId } from '@/config/sites';
import { unwrapWp, wpRequest, type WpParams, type WpResult } from './client';
import { wpTags } from './tags';
import type {
  WpCategory,
  WpList,
  WpPage,
  WpPost,
  WpPostIdSlug,
  WpPostSummary,
  WpSearchResult,
} from './types';

const POST_SUMMARY_FIELDS = ['id', 'date', 'slug', 'title', 'excerpt', 'featured_media', 'views'];
const POST_FIELDS = [...POST_SUMMARY_FIELDS, 'modified', 'content', 'categories'];
const PAGE_FIELDS = ['id', 'slug', 'modified', 'title', 'content', 'excerpt'];
const CATEGORY_FIELDS = ['id', 'name', 'slug', 'description', 'parent', 'count'];

const POST_SUMMARY_PARAMS = {
  _fields: POST_SUMMARY_FIELDS,
  _embed: ['wp:featuredmedia'],
} as const satisfies WpParams;

/** Legacy category/search page size. */
export const DEFAULT_PER_PAGE = 8;
const MAX_PER_PAGE = 100;
const MAX_SLUG_LENGTH = 200;
const MAX_QUERY_LENGTH = 200;

// ---------- input helpers ----------

function isId(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

/**
 * Decodes a slug from a URL (ru slugs are Cyrillic, stored percent-encoded in WP — Q4).
 * WP matches both forms; decoding keeps one cache entry per slug.
 */
function normalizeSlug(slug: string): string | null {
  let s = slug.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // malformed escape: keep as is, WP will just not find it
  }
  s = s.toLowerCase();
  return s.length > 0 && s.length <= MAX_SLUG_LENGTH ? s : null;
}

function toList<T>(result: WpResult<T[]>): WpList<T> | null {
  const ok = unwrapWp(result);
  if (!ok) return null;
  return {
    items: ok.data,
    total: ok.total ?? ok.data.length,
    totalPages: ok.totalPages ?? (ok.data.length > 0 ? 1 : 0),
  };
}

function firstOf<T>(result: WpResult<T[]>): T | null {
  return unwrapWp(result)?.data[0] ?? null;
}

// ---------- posts ----------

async function cachedPost(site: SiteId, id: number): Promise<WpResult<WpPost>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.post(site, id));
  const r = await wpRequest<WpPost>(site, `posts/${id}`, {
    _fields: POST_FIELDS,
    _embed: ['wp:featuredmedia', 'wp:term'],
  });
  if (r.status === 'ok') cacheLife('hours');
  else if (r.status === 'not_found') cacheLife('minutes');
  else cacheLife('seconds');
  return r;
}

/** Full post with featured media and categories embedded. */
export async function getPost(site: SiteId, id: number): Promise<WpPost | null> {
  if (!isId(id)) return null;
  return unwrapWp(await cachedPost(site, id))?.data ?? null;
}

async function cachedPostIdSlug(site: SiteId, id: number): Promise<WpResult<WpPostIdSlug>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.post(site, id));
  const r = await wpRequest<WpPostIdSlug>(site, `posts/${id}`, { _fields: ['id', 'slug'] });
  if (r.status === 'ok') cacheLife('hours');
  else if (r.status === 'not_found') cacheLife('minutes');
  else cacheLife('seconds');
  return r;
}

/** Light id → slug lookup for redirects (`/post?id=` → `/post/<id>-<slug>`). */
export async function getPostIdSlug(site: SiteId, id: number): Promise<WpPostIdSlug | null> {
  if (!isId(id)) return null;
  return unwrapWp(await cachedPostIdSlug(site, id))?.data ?? null;
}

export interface GetPostsOptions {
  /** Posts in any of these categories (WP `categories=` is OR). */
  readonly categories?: readonly number[];
  /** 1-based. */
  readonly page?: number;
  readonly perPage?: number;
}

async function cachedPosts(
  site: SiteId,
  categories: readonly number[],
  page: number,
  perPage: number,
): Promise<WpResult<WpPostSummary[]>> {
  'use cache';
  cacheTag(
    wpTags.site(site),
    wpTags.posts(site),
    ...categories.map((id) => wpTags.category(site, id)),
  );
  const r = await wpRequest<WpPostSummary[]>(site, 'posts', {
    ...POST_SUMMARY_PARAMS,
    categories: categories.length > 0 ? categories : undefined,
    page,
    per_page: perPage,
    orderby: 'date',
    order: 'desc',
  });
  if (r.status === 'ok') cacheLife('minutes');
  else if (r.status === 'not_found') cacheLife('minutes');
  else cacheLife('seconds');
  return r;
}

/** Newest first. `null` when `page` is past the last page. */
export async function getPosts(
  site: SiteId,
  { categories = [], page = 1, perPage = DEFAULT_PER_PAGE }: GetPostsOptions = {},
): Promise<WpList<WpPostSummary> | null> {
  if (!isId(page) || !isId(perPage) || perPage > MAX_PER_PAGE) return null;
  if (!categories.every(isId)) return null;
  // Sorted + deduplicated so equal filters share one cache entry.
  const cats = [...new Set(categories)].sort((a, b) => a - b);
  return toList(await cachedPosts(site, cats, page, perPage));
}

export interface SearchPostsOptions {
  readonly q: string;
  /** 1-based. */
  readonly page?: number;
}

async function cachedSearch(
  site: SiteId,
  q: string,
  page: number,
): Promise<WpResult<WpSearchResult[]>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.posts(site));
  const r = await wpRequest<WpSearchResult[]>(site, 'posts', {
    ...POST_SUMMARY_PARAMS,
    search: q,
    page,
    per_page: DEFAULT_PER_PAGE,
    // WP sorts by relevance when `search` is set; Q17 wants newest first.
    orderby: 'date',
    order: 'desc',
  });
  if (r.status === 'ok') cacheLife('minutes');
  else if (r.status === 'not_found') cacheLife('minutes');
  else cacheLife('seconds');
  return r;
}

const EMPTY_LIST: WpList<never> = { items: [], total: 0, totalPages: 0 };

/**
 * Search posts only (Q17), newest first. An empty query gives an empty list
 * without a request; `null` when `page` is past the last page.
 */
export async function searchPosts(
  site: SiteId,
  { q, page = 1 }: SearchPostsOptions,
): Promise<WpList<WpSearchResult> | null> {
  if (!isId(page)) return null;
  const query = q.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);
  if (query.length === 0) return page === 1 ? EMPTY_LIST : null;
  return toList(await cachedSearch(site, query, page));
}

// ---------- pages ----------

async function cachedPageBySlug(site: SiteId, slug: string): Promise<WpResult<WpPage[]>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.pages(site));
  const r = await wpRequest<WpPage[]>(site, 'pages', { _fields: PAGE_FIELDS, slug });
  if (r.status === 'ok') {
    for (const p of r.data) cacheTag(wpTags.page(site, p.id));
    if (r.data.length > 0) cacheLife('hours');
    else cacheLife('minutes');
  } else if (r.status === 'not_found') cacheLife('minutes');
  else cacheLife('seconds');
  return r;
}

export async function getPage(site: SiteId, slug: string): Promise<WpPage | null> {
  const s = normalizeSlug(slug);
  if (!s) return null;
  return firstOf(await cachedPageBySlug(site, s));
}

async function cachedPageById(site: SiteId, id: number): Promise<WpResult<WpPage>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.page(site, id));
  const r = await wpRequest<WpPage>(site, `pages/${id}`, { _fields: PAGE_FIELDS });
  if (r.status === 'ok') cacheLife('hours');
  else if (r.status === 'not_found') cacheLife('minutes');
  else cacheLife('seconds');
  return r;
}

/** By id: footer/widget links in `sites.ts`, old `/page?id=` redirects. */
export async function getPageById(site: SiteId, id: number): Promise<WpPage | null> {
  if (!isId(id)) return null;
  return unwrapWp(await cachedPageById(site, id))?.data ?? null;
}

// ---------- categories ----------

async function cachedCategoryBySlug(site: SiteId, slug: string): Promise<WpResult<WpCategory[]>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.categories(site));
  const r = await wpRequest<WpCategory[]>(site, 'categories', { _fields: CATEGORY_FIELDS, slug });
  if (r.status === 'ok') {
    for (const c of r.data) cacheTag(wpTags.category(site, c.id));
    if (r.data.length > 0) cacheLife('hours');
    else cacheLife('minutes');
  } else if (r.status === 'not_found') cacheLife('minutes');
  else cacheLife('seconds');
  return r;
}

export async function getCategoryBySlug(site: SiteId, slug: string): Promise<WpCategory | null> {
  const s = normalizeSlug(slug);
  if (!s) return null;
  return firstOf(await cachedCategoryBySlug(site, s));
}

async function cachedCategoryById(site: SiteId, id: number): Promise<WpResult<WpCategory>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.category(site, id));
  const r = await wpRequest<WpCategory>(site, `categories/${id}`, { _fields: CATEGORY_FIELDS });
  if (r.status === 'ok') cacheLife('hours');
  else if (r.status === 'not_found') cacheLife('minutes');
  else cacheLife('seconds');
  return r;
}

/** By id: home sliders/footer in `sites.ts`, old `/category?id=` redirects. */
export async function getCategoryById(site: SiteId, id: number): Promise<WpCategory | null> {
  if (!isId(id)) return null;
  return unwrapWp(await cachedCategoryById(site, id))?.data ?? null;
}
