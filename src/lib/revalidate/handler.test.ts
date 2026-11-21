import { describe, expect, it, vi } from 'vitest';
import { createRevalidateHandler } from './handler';

const ENV = { REVALIDATE_SECRET_RU: 'ru-secret', REVALIDATE_SECRET_RO: 'ro-secret' };

function req(body: unknown, headers: Record<string, string> = {}, site = 'ru'): Request {
  return new Request('https://ru.baptist.org.md/api/revalidate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-site': site, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function setup(env: Record<string, string | undefined> = ENV) {
  const revalidateTag = vi.fn();
  return { revalidateTag, handle: createRevalidateHandler({ revalidateTag, env }) };
}

const event = (o: Record<string, unknown> = {}) => ({
  site: 'ru',
  type: 'post',
  id: 113186,
  slug: '%d0%bf%d1%80%d0%b8',
  action: 'update',
  ...o,
});

describe('POST /api/revalidate', () => {
  it('401 without a secret', async () => {
    const { revalidateTag, handle } = setup();
    expect((await handle(req(event()))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('401 with a wrong secret or the secret of the other site', async () => {
    const { revalidateTag, handle } = setup();
    expect((await handle(req(event(), { 'x-union-secret': 'nope' }))).status).toBe(401);
    expect((await handle(req(event(), { 'x-union-secret': 'ro-secret' }))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('401 when the site has no secret configured (even with an empty header)', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { handle } = setup({});
    expect((await handle(req(event(), { 'x-union-secret': '' }))).status).toBe(401);
    error.mockRestore();
  });

  it.each([
    ['post', 'update', ['post:ru:113186', 'posts:ru'], 'max'],
    ['post', 'unpublish', ['post:ru:113186', 'posts:ru'], { expire: 0 }],
    ['page', 'publish', ['page:ru:113186', 'pages:ru', 'menu:ru'], 'max'],
    [
      'category',
      'delete',
      ['category:ru:113186', 'categories:ru', 'posts:ru', 'menu:ru'],
      { expire: 0 },
    ],
    ['menu', 'update', ['menu:ru'], 'max'],
  ])('%s/%s → tags', async (type, action, tags, profile) => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { revalidateTag, handle } = setup();
    const res = await handle(req(event({ type, action }), { 'x-union-secret': 'ru-secret' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true, tags });
    expect(revalidateTag.mock.calls).toEqual(tags.map((t) => [t, profile]));
    info.mockRestore();
  });

  it('400 on invalid payloads and on a site mismatch', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { revalidateTag, handle } = setup();
    const auth = { 'x-union-secret': 'ru-secret' };
    const bad = [
      'not json',
      event({ type: 'attachment' }),
      event({ id: 0 }),
      event({ action: 'x' }),
    ];
    for (const body of bad) {
      expect((await handle(req(body, auth))).status).toBe(400);
    }
    expect((await handle(req(event({ site: 'ro' }), auth))).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('404 without x-site', async () => {
    const { handle } = setup();
    expect((await handle(req(event(), {}, 'xx'))).status).toBe(404);
  });
});
