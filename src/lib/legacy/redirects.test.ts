import { describe, expect, it, vi } from 'vitest';
import type { WpResult } from '@/lib/wp/client';
import type { WpPostIdSlug } from '@/lib/wp/types';
import { createSlugLookup, FOUND_TTL_MS, NOT_FOUND_TTL_MS, type LookupFn, type SlugLookup } from './lookup';
import { resolveLegacy } from './redirects';

const RU_WP = '%d0%bf%d1%80%d0%b0%d0%b7%d0%b4%d0%bd%d0%b8%d0%ba-40';
const RU_ENC = '%D0%BF%D1%80%D0%B0%D0%B7%D0%B4%D0%BD%D0%B8%D0%BA-40';

function lookupOf(answer: SlugLookup): LookupFn & ReturnType<typeof vi.fn> {
  return vi.fn(async () => answer) as never;
}
const found = (slug: string) => lookupOf({ status: 'found', slug });

async function run(url: string, lookup: LookupFn = found('slug')) {
  const u = new URL(url, 'https://ro.baptist.org.md');
  return resolveLegacy(u.pathname, u.searchParams, 'ro', lookup);
}

describe('resolveLegacy: post', () => {
  it('redirects /post?id= to /post/{id}-{slug} with 301', async () => {
    const lookup = found('hello-world');
    expect(await run('/post?id=16303', lookup)).toEqual({
      type: 'redirect',
      status: 301,
      location: '/post/16303-hello-world',
    });
    expect(lookup).toHaveBeenCalledWith('ro', 'post', 16303);
  });

  it('encodes Cyrillic slugs once (Q4)', async () => {
    expect(await run('/post?id=113186', found(RU_WP))).toMatchObject({
      location: `/post/113186-${RU_ENC}`,
    });
  });

  it('keeps utm_* and other params, drops fbclid', async () => {
    expect(
      await run('/post?utm_source=fb&id=5&fbclid=abc&utm_medium=social&x=a%20b'),
    ).toMatchObject({ location: '/post/5-slug?utm_source=fb&utm_medium=social&x=a+b' });
  });

  it('404s an unknown or invalid id', async () => {
    expect(await run('/post?id=999999999', lookupOf({ status: 'not_found' }))).toEqual({
      type: 'not_found',
    });
    const lookup = found('x');
    for (const id of ['abc', '0', '-1', '', '1e3', '1234567890123456']) {
      expect(await run(`/post?id=${id}`, lookup)).toEqual({ type: 'not_found' });
    }
    expect(lookup).not.toHaveBeenCalled();
  });

  it('falls back to /post/{id} (temporary) when WP fails', async () => {
    expect(await run('/post?id=7&utm_source=x', lookupOf({ status: 'error' }))).toEqual({
      type: 'redirect',
      status: 302,
      location: '/post/7?utm_source=x',
    });
  });

  it('uses /post/{id} for a post without slug', async () => {
    expect(await run('/post?id=7', found(''))).toMatchObject({ status: 301, location: '/post/7' });
  });
});

describe('resolveLegacy: page and category', () => {
  it('redirects /page?id= to /page/{slug}', async () => {
    const lookup = found('despre-noi');
    expect(await run('/page?id=893', lookup)).toEqual({
      type: 'redirect',
      status: 301,
      location: '/page/despre-noi',
    });
    expect(lookup).toHaveBeenCalledWith('ro', 'page', 893);
  });

  it('redirects /category?id=&page=', async () => {
    const lookup = found('stiri');
    expect(await run('/category?id=23', lookup)).toMatchObject({ location: '/category/stiri' });
    expect(await run('/category?id=23&page=1', lookup)).toMatchObject({
      location: '/category/stiri',
    });
    expect(await run('/category?id=23&page=3&utm_campaign=c', lookup)).toMatchObject({
      status: 301,
      location: '/category/stiri/3?utm_campaign=c',
    });
    expect(await run('/category?id=23&page=abc', lookup)).toMatchObject({
      location: '/category/stiri',
    });
    expect(lookup).toHaveBeenCalledWith('ro', 'category', 23);
  });

  it('404s unknown ids, 503s on WP failure', async () => {
    expect(await run('/page?id=1', lookupOf({ status: 'not_found' }))).toEqual({ type: 'not_found' });
    expect(await run('/category?id=1', lookupOf({ status: 'error' }))).toEqual({
      type: 'unavailable',
    });
    expect(await run('/page?id=1', lookupOf({ status: 'error' }))).toEqual({ type: 'unavailable' });
  });
});

describe('resolveLegacy: search', () => {
  it('renames query → q, keeps page > 1 and other params', async () => {
    const lookup = found('x');
    expect(await run('/search?query=mamă%20bună&page=2&utm_source=x&fbclid=1', lookup)).toEqual({
      type: 'redirect',
      status: 301,
      location: `/search?q=${encodeURIComponent('mamă bună')}&page=2&utm_source=x`,
    });
    expect(await run('/search?query=abc&page=1', lookup)).toMatchObject({
      location: '/search?q=abc',
    });
    expect(await run('/search?query=', lookup)).toMatchObject({ location: '/search' });
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe('resolveLegacy: not legacy', () => {
  it('leaves other URLs alone', async () => {
    for (const url of [
      '/',
      '/post',
      '/post/5-slug?id=3',
      '/search?q=abc',
      '/category/stiri?page=2',
      '/?p=123',
      '/post?p=123',
    ]) {
      expect(await run(url)).toBeNull();
    }
  });
});

describe('createSlugLookup', () => {
  const ok = (slug: string): WpResult<WpPostIdSlug> => ({
    status: 'ok',
    data: { id: 1, slug },
    total: null,
    totalPages: null,
  });

  it('caches found / not found with TTL, never errors', async () => {
    let t = 0;
    const request = vi.fn<(site: string, path: string) => Promise<WpResult<WpPostIdSlug>>>();
    const lookup = createSlugLookup({ request, now: () => t });

    request.mockResolvedValueOnce(ok('a'));
    expect(await lookup('ro', 'post', 1)).toEqual({ status: 'found', slug: 'a' });
    expect(await lookup('ro', 'post', 1)).toEqual({ status: 'found', slug: 'a' });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('ro', 'posts/1');

    // Different site / kind → different entries.
    request.mockResolvedValueOnce(ok('b'));
    await lookup('ru', 'post', 1);
    request.mockResolvedValueOnce(ok('c'));
    await lookup('ro', 'category', 1);
    expect(request).toHaveBeenLastCalledWith('ro', 'categories/1');

    t += FOUND_TTL_MS;
    request.mockResolvedValueOnce(ok('a2'));
    expect(await lookup('ro', 'post', 1)).toEqual({ status: 'found', slug: 'a2' });

    request.mockResolvedValueOnce({ status: 'not_found' });
    expect(await lookup('ro', 'page', 9)).toEqual({ status: 'not_found' });
    expect(await lookup('ro', 'page', 9)).toEqual({ status: 'not_found' });
    t += NOT_FOUND_TTL_MS;
    request.mockResolvedValueOnce(ok('p'));
    expect(await lookup('ro', 'page', 9)).toEqual({ status: 'found', slug: 'p' });

    const err: WpResult<WpPostIdSlug> = {
      status: 'error',
      error: { kind: 'timeout', message: 't', url: 'u' },
    };
    request.mockResolvedValueOnce(err).mockResolvedValueOnce(ok('z'));
    expect(await lookup('ro', 'post', 2)).toEqual({ status: 'error' });
    expect(await lookup('ro', 'post', 2)).toEqual({ status: 'found', slug: 'z' });

    request.mockRejectedValueOnce(new Error('boom'));
    expect(await lookup('ro', 'post', 3)).toEqual({ status: 'error' });
  });

  it('treats rest_forbidden (draft/private post) as not found', async () => {
    const request = vi.fn(async (): Promise<WpResult<WpPostIdSlug>> => ({
      status: 'error',
      error: { kind: 'http', message: 'm', url: 'u', status: 401, code: 'rest_forbidden' },
    }));
    expect(await createSlugLookup({ request })('ro', 'post', 1)).toEqual({ status: 'not_found' });
  });

  it('needs a slug for pages/categories', async () => {
    const request = vi.fn(async () => ok(''));
    expect(await createSlugLookup({ request })('ro', 'page', 1)).toEqual({ status: 'not_found' });
  });

  it('de-duplicates parallel requests for one id', async () => {
    let resolve!: (r: WpResult<WpPostIdSlug>) => void;
    const request = vi.fn(() => new Promise<WpResult<WpPostIdSlug>>((r) => (resolve = r)));
    const lookup = createSlugLookup({ request });
    const a = lookup('ro', 'post', 1);
    const b = lookup('ro', 'post', 1);
    resolve(ok('s'));
    expect(await a).toEqual(await b);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
