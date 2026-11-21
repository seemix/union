/**
 * WP data for `src/app/[site]/sitemap.ts`: only the fields a sitemap needs, fetched in
 * pages of 100 (the WP maximum) and cached like the rest of the data layer (./api.ts).
 *
 * Chunks: a sitemap file holds at most `SITEMAP_MAX_URLS` URLs (Google allows 50 000;
 * 5 000 keeps each response small and each chunk's WP fan-out at 50 requests).
 *   id 0      — home, categories, pages
 *   id 1…N    — posts, oldest first (`orderby=id&order=asc`), so a new post only ever
 *               changes the last chunk and older chunks keep their contents.
 *
 * Only what WP returns to an anonymous client is listed: published posts/pages, categories
 * with at least one post. Those are exactly the URLs that answer `200` (never a redirect).
 */
import { cacheLife, cacheTag } from 'next/cache';
import type { SiteId } from '@/config/sites';
import { cacheLifeFor } from './cache-life';
import { unwrapWp, wpRequest, type WpResult } from './client';
import { wpTags } from './tags';

export const SITEMAP_MAX_URLS = 5000;
const WP_PAGE_SIZE = 100;
/** WP requests in flight at once while filling a chunk. */
const CONCURRENCY = 10;

export interface SitemapPostRow {
  readonly id: number;
  readonly slug: string;
  /** UTC, ISO without zone. */
  readonly modified_gmt: string;
}

export interface SitemapPageRow {
  readonly id: number;
  readonly slug: string;
  readonly modified_gmt: string;
}

export interface SitemapCategoryRow {
  readonly id: number;
  readonly slug: string;
}

const ok = <T>(data: T): WpResult<T> => ({ status: 'ok', data, total: null, totalPages: null });

/** Number of sitemap files needed for `totalPosts` posts. */
export function postChunkCount(totalPosts: number): number {
  return Math.ceil(Math.max(0, totalPosts) / SITEMAP_MAX_URLS);
}

async function cachedPostTotal(site: SiteId): Promise<WpResult<number>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.posts(site));
  const r = await wpRequest<{ id: number }[]>(site, 'posts', { _fields: ['id'], per_page: 1 });
  if (r.status === 'ok') {
    cacheLife('minutes');
    return ok(r.total ?? r.data.length);
  }
  cacheLife('seconds');
  return r.status === 'not_found' ? ok(0) : r;
}

/** Number of published posts (`X-WP-Total`). Throws `WpError` when WP fails. */
export async function getPostTotal(site: SiteId): Promise<number> {
  return unwrapWp(await cachedPostTotal(site))?.data ?? 0;
}

/** Number of post chunks (sitemap ids `1…n`). */
export async function getPostChunkCount(site: SiteId): Promise<number> {
  return postChunkCount(await getPostTotal(site));
}

async function cachedPostChunk(site: SiteId, chunk: number): Promise<WpResult<SitemapPostRow[]>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.posts(site));

  const pagesPerChunk = SITEMAP_MAX_URLS / WP_PAGE_SIZE;
  const firstPage = chunk * pagesPerChunk + 1;
  const rows: SitemapPostRow[] = [];

  for (let offset = 0; offset < pagesPerChunk; offset += CONCURRENCY) {
    const count = Math.min(CONCURRENCY, pagesPerChunk - offset);
    const results = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        wpRequest<SitemapPostRow[]>(site, 'posts', {
          _fields: ['id', 'slug', 'modified_gmt'],
          per_page: WP_PAGE_SIZE,
          page: firstPage + offset + i,
          orderby: 'id',
          order: 'asc',
        }),
      ),
    );
    let done = false;
    for (const r of results) {
      if (r.status === 'error') {
        // Never cache a half-filled chunk: the whole sitemap request fails and is retried.
        cacheLife('seconds');
        return r;
      }
      // `not_found` = page number past the last page (WP answers 400): the end of the data.
      if (r.status === 'not_found') {
        done = true;
        continue;
      }
      rows.push(...r.data);
      if (r.data.length < WP_PAGE_SIZE) done = true;
    }
    if (done) break;
  }

  cacheLife('hours');
  return ok(rows);
}

/** Posts of sitemap chunk `chunk` (0-based). Throws `WpError` when WP fails. */
export async function getSitemapPosts(site: SiteId, chunk: number): Promise<SitemapPostRow[]> {
  return unwrapWp(await cachedPostChunk(site, chunk))?.data ?? [];
}

/** Fetches every page of a WP collection (100 per request). Never partial: errors are returned. */
async function fetchAll<T>(
  site: SiteId,
  path: string,
  params: Parameters<typeof wpRequest>[2],
): Promise<WpResult<T[]>> {
  const rows: T[] = [];
  for (let page = 1; ; page++) {
    const r = await wpRequest<T[]>(site, path, { ...params, per_page: WP_PAGE_SIZE, page });
    if (r.status === 'error') return r;
    if (r.status === 'not_found') break;
    rows.push(...r.data);
    if (page >= (r.totalPages ?? 1) || r.data.length === 0) break;
  }
  return ok(rows);
}

async function cachedPageRows(site: SiteId): Promise<WpResult<SitemapPageRow[]>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.pages(site));
  const r = await fetchAll<SitemapPageRow>(site, 'pages', {
    _fields: ['id', 'slug', 'modified_gmt'],
    orderby: 'id',
    order: 'asc',
  });
  cacheLifeFor(r.status, 'hours');
  return r;
}

/** All published pages. Throws `WpError` when WP fails. */
export async function getSitemapPages(site: SiteId): Promise<SitemapPageRow[]> {
  return unwrapWp(await cachedPageRows(site))?.data ?? [];
}

async function cachedCategoryRows(site: SiteId): Promise<WpResult<SitemapCategoryRow[]>> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.categories(site), wpTags.posts(site));
  const r = await fetchAll<SitemapCategoryRow>(site, 'categories', {
    _fields: ['id', 'slug'],
    hide_empty: true,
    orderby: 'id',
    order: 'asc',
  });
  cacheLifeFor(r.status, 'hours');
  return r;
}

/** Categories that have at least one post (an empty category page is thin content). */
export async function getSitemapCategories(site: SiteId): Promise<SitemapCategoryRow[]> {
  return unwrapWp(await cachedCategoryRows(site))?.data ?? [];
}
