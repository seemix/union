import { describe, expect, it, vi } from 'vitest';
import { clientKey, createViewsHandler, POST_WINDOW_MS, viewsUrl, VIEW_WINDOW_MS } from './handler';
import { isBot } from './bots';
import { TtlCache } from '@/lib/cache/ttl-cache';
import { WindowCounter } from './window-counter';

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

function req(headers: Record<string, string> = {}, site = 'ro'): Request {
  return new Request('https://ro.baptist.org.md/api/views/16303', {
    method: 'POST',
    headers: {
      'x-site': site,
      'user-agent': CHROME,
      'x-forwarded-for': '203.0.113.7',
      'sec-fetch-site': 'same-origin',
      ...headers,
    },
  });
}

function setup(opts: { now?: () => number; status?: number } = {}) {
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () => new Response('{"id":16303,"views":2}', { status: opts.status ?? 200 }),
  );
  const handle = createViewsHandler({
    fetch,
    limiter: new TtlCache<true>(100, opts.now),
    env: { VIEWS_SECRET_RO: 'ro-secret', VIEWS_SECRET_RU: 'ru-secret' },
  });
  return { fetch, handle };
}

function sent(fetch: ReturnType<typeof setup>['fetch'], i = 0) {
  const [url, init] = fetch.mock.calls[i]!;
  return { url: String(url), init: init!, headers: init!.headers as Record<string, string> };
}

describe('POST /api/views/[id]', () => {
  it('proxies to WP with the secret of the site and answers 204 with no body', async () => {
    const { fetch, handle } = setup();
    const res = await handle(req(), '16303');
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(fetch).toHaveBeenCalledTimes(1);
    const { url, init, headers } = sent(fetch);
    expect(url).toBe(viewsUrl('ro', 16303));
    expect(new URL(url).searchParams.get('rest_route')).toBe('/baptist/v1/views/16303');
    expect(init.method).toBe('POST');
    expect(headers['X-Union-Secret']).toBe('ro-secret');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('uses the secret of the site from x-site', async () => {
    const { fetch, handle } = setup();
    await handle(req({}, 'ru'), '113186');
    const { url, headers } = sent(fetch);
    expect(url).toContain('/ru/');
    expect(headers['X-Union-Secret']).toBe('ru-secret');
  });

  it('does not increment a repeated view from the same IP within 30 min', async () => {
    let now = 1_000_000;
    const { fetch, handle } = setup({ now: () => now });
    expect((await handle(req(), '16303')).status).toBe(204);
    expect((await handle(req(), '16303')).status).toBe(204);
    now += VIEW_WINDOW_MS - 1;
    await handle(req(), '16303');
    expect(fetch).toHaveBeenCalledTimes(1);

    // another post, another IP: counted
    await handle(req(), '16304');
    await handle(req({ 'x-forwarded-for': '198.51.100.1' }), '16303');
    expect(fetch).toHaveBeenCalledTimes(3);

    // after the window: counted again
    now += 2;
    await handle(req(), '16303');
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('ignores client-set X-Real-IP and the left-most X-Forwarded-For entries', async () => {
    const { fetch, handle } = setup();
    await handle(
      req({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.1, 203.0.113.7' }),
      '16303',
    );
    await handle(
      req({ 'x-real-ip': '2.2.2.2', 'x-forwarded-for': '9.9.9.2, 203.0.113.7' }),
      '16303',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('caps counted views per post, whatever the claimed IP', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('{}'));
    const handle = createViewsHandler({
      fetch,
      postLimiter: new WindowCounter(3, POST_WINDOW_MS, 100, () => 0),
      env: { VIEWS_SECRET_RO: 'ro-secret' },
    });
    for (let i = 1; i <= 10; i++) {
      await handle(req({ 'x-forwarded-for': `198.51.100.${i}` }), '16303');
    }
    expect(fetch).toHaveBeenCalledTimes(3);
    await handle(req({ 'x-forwarded-for': '198.51.100.99' }), '16304'); // other post: own budget
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('drops parallel duplicates', async () => {
    const { fetch, handle } = setup();
    await Promise.all([handle(req(), '16303'), handle(req(), '16303'), handle(req(), '16303')]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
    ['Yandex', 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)'],
    [
      'Facebook preview',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    ],
    ['Telegram preview', 'TelegramBot (like TwitterBot)'],
    ['curl', 'curl/8.5.0'],
    ['headless', CHROME.replace('Chrome/', 'HeadlessChrome/')],
    ['empty', ''],
  ])('does not increment for a bot: %s', async (_, ua) => {
    const { fetch, handle } = setup();
    const res = await handle(req({ 'user-agent': ua }), '16303');
    expect(res.status).toBe(204);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not increment for prefetch or cross-site requests', async () => {
    const { fetch, handle } = setup();
    await handle(req({ 'sec-purpose': 'prefetch' }), '16303');
    await handle(req({ 'sec-fetch-site': 'cross-site' }), '16303');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['0', '007', '-1', '1.5', 'abc', '12345678901'])('rejects id %s with 400', async (id) => {
    const { fetch, handle } = setup();
    expect((await handle(req(), id)).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('404 without a valid x-site', async () => {
    const { handle } = setup();
    expect((await handle(req({}, 'en'), '1')).status).toBe(404);
  });

  it('no secret configured → nothing sent, still 204', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handle = createViewsHandler({ fetch, env: {} });
    expect((await handle(req(), '16303')).status).toBe(204);
    expect(fetch).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('a WP failure frees the slot, so the next visit retries', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { fetch, handle } = setup({ status: 503 });
    expect((await handle(req(), '16303')).status).toBe(204);
    await handle(req(), '16303');
    expect(fetch).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });
});

describe('clientKey', () => {
  const h = (init: Record<string, string>) => new Headers({ 'user-agent': 'UA', ...init });

  it('takes the right-most X-Forwarded-For entry (appended by our proxy)', () => {
    expect(clientKey(h({ 'x-forwarded-for': '6.6.6.6, 203.0.113.7' }))).toBe('ip:203.0.113.7');
  });

  it('ignores X-Real-IP / CF-Connecting-IP unless configured', () => {
    expect(clientKey(h({ 'x-real-ip': '1.1.1.1', 'cf-connecting-ip': '2.2.2.2' }))).toBe('ua:UA');
    expect(clientKey(h({ 'x-real-ip': '1.1.1.1' }), 'x-real-ip')).toBe('ip:1.1.1.1');
  });

  it('falls back to the User-Agent for garbage values', () => {
    expect(clientKey(h({ 'x-forwarded-for': 'not an ip' }))).toBe('ua:UA');
  });

  it('CLIENT_IP_HEADER selects the header', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('{}'));
    const handle = createViewsHandler({
      fetch,
      env: { VIEWS_SECRET_RO: 's', CLIENT_IP_HEADER: 'X-Real-IP' },
    });
    await handle(req({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.1' }), '16303');
    await handle(req({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.2' }), '16303');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('WindowCounter', () => {
  it('resets after the window and refunds a hit', () => {
    let now = 0;
    const c = new WindowCounter(1, 1000, 10, () => now);
    expect(c.take('a')).toBe(true);
    expect(c.take('a')).toBe(false);
    c.refund('a');
    expect(c.take('a')).toBe(true);
    now = 1000;
    expect(c.take('a')).toBe(true);
  });
});

describe('isBot', () => {
  it.each([
    CHROME,
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36 Telegram-Android/11.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 YaBrowser/25.8 Safari/537.36',
  ])('lets real browsers through: %s', (ua) => {
    expect(isBot(ua)).toBe(false);
  });
});
