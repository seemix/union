import { afterEach, describe, expect, it, vi } from 'vitest';
import { WpError, buildWpUrl, wpFetch, wpRequest } from './client';

const RO_BASE = 'https://baptist.org.md/ro/?rest_route=/wp/v2/';

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('buildWpUrl', () => {
  it('appends the path to rest_route and adds params', () => {
    const url = new URL(buildWpUrl(RO_BASE, 'posts', { per_page: 5, categories: [22, 23] }));
    expect(url.origin + url.pathname).toBe('https://baptist.org.md/ro/');
    expect(url.searchParams.get('rest_route')).toBe('/wp/v2/posts');
    expect(url.searchParams.get('per_page')).toBe('5');
    expect(url.searchParams.get('categories')).toBe('22,23');
  });

  it('supports the /wp-json/ base form and strips leading slashes', () => {
    expect(buildWpUrl('https://x.test/wp-json/wp/v2', '/posts/1')).toBe(
      'https://x.test/wp-json/wp/v2/posts/1',
    );
  });

  it('skips undefined/null params', () => {
    const url = new URL(buildWpUrl(RO_BASE, 'posts', { search: undefined, page: null }));
    expect([...url.searchParams.keys()]).toEqual(['rest_route']);
  });

  it('keeps embedded relations when _fields is set', () => {
    const url = new URL(
      buildWpUrl(RO_BASE, 'posts', { _fields: ['id', 'title'], _embed: ['wp:featuredmedia'] }),
    );
    expect(url.searchParams.get('_embed')).toBe('wp:featuredmedia');
    expect(url.searchParams.get('_fields')).toBe('id,title,_links.wp:featuredmedia,_embedded');
  });

  it('encodes Cyrillic values', () => {
    const url = new URL(buildWpUrl(RO_BASE, 'pages', { slug: 'контакты' }));
    expect(url.searchParams.get('slug')).toBe('контакты');
    expect(url.search).not.toContain('контакты');
  });
});

describe('wpRequest / wpFetch', () => {
  it('returns data and pagination headers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json([{ id: 1 }], 200, { 'X-WP-Total': '17', 'X-WP-TotalPages': '3' })),
    );
    const r = await wpFetch<{ id: number }[]>('ro', 'posts');
    expect(r).toEqual({ status: 'ok', data: [{ id: 1 }], total: 17, totalPages: 3 });
  });

  it('single resources have null totals', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ id: 1 })),
    );
    const r = await wpFetch('ro', 'posts/1');
    expect(r).toMatchObject({ total: null, totalPages: null });
  });

  it('maps WP 404 to null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json(
          { code: 'rest_post_invalid_id', message: 'Invalid post ID.', data: { status: 404 } },
          404,
        ),
      ),
    );
    expect(await wpFetch('ro', 'posts/999999999')).toBeNull();
  });

  it('maps a page past the end (400 rest_post_invalid_page_number) to null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json({ code: 'rest_post_invalid_page_number', message: '…', data: { status: 400 } }, 400),
      ),
    );
    expect(await wpFetch('ro', 'posts')).toBeNull();
  });

  it('throws on rest_no_route (wrong endpoint, not missing content)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json({ code: 'rest_no_route', message: 'No route', data: { status: 404 } }, 404),
      ),
    );
    await expect(wpFetch('ro', 'nope')).rejects.toMatchObject({
      name: 'WpError',
      kind: 'http',
      status: 404,
      code: 'rest_no_route',
    });
  });

  it('throws on a non-JSON 404 (e.g. Apache page for /wp-json/)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!DOCTYPE html>', { status: 404 })),
    );
    await expect(wpFetch('ro', 'posts')).rejects.toBeInstanceOf(WpError);
  });

  it('retries once on 5xx, then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('oops', { status: 502 }))
      .mockResolvedValueOnce(json({ id: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await wpFetch('ro', 'posts/1')).toMatchObject({ data: { id: 1 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries only once on 5xx', async () => {
    const fetchMock = vi.fn(async () => new Response('oops', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await wpRequest('ro', 'posts/1');
    expect(r).toMatchObject({ status: 'error', error: { kind: 'http', status: 503 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry 4xx', async () => {
    const fetchMock = vi.fn(async () => json({ code: 'rest_forbidden', message: 'no' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    await expect(wpFetch('ro', 'posts')).rejects.toMatchObject({
      status: 401,
      code: 'rest_forbidden',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports timeouts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_, reject) => {
            init.signal!.addEventListener('abort', () => reject(init.signal!.reason));
          }),
      ),
    );
    const r = await wpRequest('ro', 'posts', {}, { timeoutMs: 20 });
    expect(r).toMatchObject({ status: 'error', error: { kind: 'timeout' } });
  });

  it('reports network errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('fetch failed'))),
    );
    expect(await wpRequest('ro', 'posts')).toMatchObject({
      status: 'error',
      error: { kind: 'network' },
    });
  });

  it('reports invalid JSON on 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>', { status: 200 })),
    );
    expect(await wpRequest('ro', 'posts')).toMatchObject({
      status: 'error',
      error: { kind: 'parse' },
    });
  });

  it('result is plain serializable data (safe to return from use cache)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('x', { status: 500 })),
    );
    const r = await wpRequest('ro', 'posts');
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });
});
