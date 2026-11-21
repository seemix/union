import { expect, test } from '@playwright/test';

/**
 * Read-only smoke against staging (`npm run test:smoke`): real WP, real content, nothing hard-coded.
 * Posts are fetched with plain HTTP (no JS) on purpose: opening them in a browser would fire the
 * view beacon and bump the production counters.
 */
const site = (info: { project: { metadata: Record<string, unknown> } }) => info.project.metadata.site as 'ru' | 'ro';

test('home renders and links to real posts', async ({ page, request }, info) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', site(info));
  const links = await page.locator('main a[href^="/post/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(links.length).toBeGreaterThan(0);
  const post = await request.get(links[0]!);
  expect(post.status()).toBe(200);
  expect(await post.text()).toMatch(/rel="canonical"/);
});

test('category + page 2 + out-of-range', async ({ page, request }) => {
  await page.goto('/');
  const cat = await page
    .locator('footer a[href^="/category"]')
    .first()
    .getAttribute('href');
  expect(cat).toBeTruthy();
  const first = await request.get(cat!); // legacy `?id=` form is followed to the slug route
  expect(first.status()).toBe(200);
  const base = new URL(first.url()).pathname;
  expect(base).toMatch(/^\/category\//);
  expect((await request.get(`${base}/2`)).status()).toBe(200);
  expect((await request.get(`${base}/99999`)).status()).toBe(404);
});

test('search works and escapes input', async ({ request }) => {
  const res = await request.get(`/search?q=${encodeURIComponent('<script>alert(1)</script>')}`);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).not.toContain('<script>alert(1)</script>');
  expect(res.headers()['x-robots-tag']).toMatch(/noindex/);
});

test('legacy redirects and 404', async ({ request }) => {
  const legacy = await request.get('/search?query=abc', { maxRedirects: 0 });
  expect(legacy.status()).toBe(301);
  expect(legacy.headers().location).toContain('/search?q=abc');
  expect((await request.get('/post?id=999999999', { maxRedirects: 0 })).status()).toBe(404);
  expect((await request.get('/no/such/path')).status()).toBe(404);
});

test('staging is not indexable', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/Disallow:\s*\/\s*$/m);
});
