/**
 * Live checks against both real WP installs (GET only).
 * Off by default; run with:  WP_LIVE=1 npx vitest run src/lib/wp/wp.live.test.ts
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SITE_IDS, getSite, type SiteId } from '@/config/sites';

const tags: string[] = [];
const lives: string[] = [];
vi.mock('next/cache', () => ({
  cacheTag: (...t: string[]) => void tags.push(...t),
  cacheLife: (profile: string) => void lives.push(profile),
}));

const api = await import('./api');
const { wpFetch } = await import('./client');

/** Known content per site (from SITES-CONFIG / PROMPTS). */
const KNOWN: Record<SiteId, { post: number; pageId: number; categoryId: number; query: string }> = {
  ru: { post: 113186, pageId: 111876, categoryId: 17, query: 'конференция' },
  ro: { post: 16303, pageId: 15459, categoryId: 23, query: 'conferinta' },
};

beforeEach(() => {
  tags.length = 0;
  lives.length = 0;
});

describe.runIf(process.env.WP_LIVE === '1').each(SITE_IDS)('live WP: %s', (site) => {
  const k = KNOWN[site];

  it('getPost: views number, embedded media sizes and categories', async () => {
    const post = await api.getPost(site, k.post);
    expect(post).not.toBeNull();
    expect(post!.id).toBe(k.post);
    expect(typeof post!.views).toBe('number');
    expect(post!.content.rendered.length).toBeGreaterThan(0);
    const media = post!._embedded?.['wp:featuredmedia']?.[0];
    expect(media && 'source_url' in media).toBe(true);
    if (media && 'source_url' in media) {
      expect(Object.keys(media.media_details.sizes ?? {})).toContain('medium');
    }
    const cats = post!._embedded?.['wp:term']?.[0] ?? [];
    expect(cats.map((c) => c.id).sort()).toEqual([...post!.categories].sort());
    expect(tags).toEqual([`site:${site}`, `post:${site}:${k.post}`]);
    expect(lives).toEqual(['hours']);
  });

  it('getPost / getPostIdSlug: missing id → null', async () => {
    expect(await api.getPost(site, 999_999_999)).toBeNull();
    expect(lives).toEqual(['minutes']);
    expect(await api.getPostIdSlug(site, 999_999_999)).toBeNull();
    expect(await api.getPost(site, -1)).toBeNull();
  });

  it('getPostIdSlug', async () => {
    const r = await api.getPostIdSlug(site, k.post);
    expect(r).toEqual({ id: k.post, slug: expect.any(String) });
  });

  it('getPageById + getPage by (decoded) slug', async () => {
    const byId = await api.getPageById(site, k.pageId);
    expect(byId?.id).toBe(k.pageId);
    const bySlug = await api.getPage(site, decodeURIComponent(byId!.slug));
    expect(bySlug?.id).toBe(k.pageId);
    expect(tags).toContain(`page:${site}:${k.pageId}`);
    // encoded form (as WP stores it) hits the same page
    expect((await api.getPage(site, byId!.slug))?.id).toBe(k.pageId);
    expect(await api.getPage(site, 'no-such-page-xyz')).toBeNull();
  });

  it('getCategoryById + getCategoryBySlug', async () => {
    const byId = await api.getCategoryById(site, k.categoryId);
    expect(byId?.id).toBe(k.categoryId);
    const bySlug = await api.getCategoryBySlug(site, byId!.slug);
    expect(bySlug?.id).toBe(k.categoryId);
    expect(await api.getCategoryBySlug(site, 'no-such-category-xyz')).toBeNull();
    expect(await api.getCategoryById(site, 999_999_999)).toBeNull();
  });

  it('getPosts: category filter, pagination headers, page past end → null', async () => {
    const list = await api.getPosts(site, { categories: [k.categoryId], page: 2, perPage: 4 });
    expect(list!.items).toHaveLength(4);
    expect(list!.total).toBeGreaterThan(8);
    expect(list!.totalPages).toBe(Math.ceil(list!.total / 4));
    const dates = list!.items.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(tags).toEqual([`site:${site}`, `posts:${site}`, `category:${site}:${k.categoryId}`]);
    expect(await api.getPosts(site, { categories: [k.categoryId], page: 99_999 })).toBeNull();
  });

  it('searchPosts: posts only, newest first; empty query', async () => {
    const r = await api.searchPosts(site, { q: `  ${k.query} ` });
    expect(r!.items.length).toBeGreaterThan(0);
    expect(r!.totalPages).toBe(Math.ceil(r!.total / api.DEFAULT_PER_PAGE));
    const dates = r!.items.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(await api.searchPosts(site, { q: '   ' })).toEqual({
      items: [],
      total: 0,
      totalPages: 0,
    });
    expect(await api.searchPosts(site, { q: 'zzqqxxnothing' })).toEqual({
      items: [],
      total: 0,
      totalPages: 0,
    });
  });

  it('wpFetch: unknown route throws WpError (not null)', async () => {
    await expect(wpFetch(site, 'no-such-route')).rejects.toMatchObject({
      name: 'WpError',
      code: 'rest_no_route',
    });
    expect(getSite(site).wp.restBase).toContain('rest_route=');
  });
});
