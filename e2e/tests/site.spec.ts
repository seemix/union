import { expect, test } from '@playwright/test';
import { dictOf, fixturesOf, resetViews, siteOf, viewLog } from './helpers';

/** Next 16 sends `Location` twice on prerendered redirects (identical values); Playwright joins them. */
const firstLocation = (value: string) => value.split(', ')[0]!;

// Each project (`ru`, `ro`) runs this whole file against its own host.

test.describe('home', () => {
  test('renders header, sliders, widgets and footer', async ({ page }, info) => {
    const site = siteOf(info);
    const { config } = fixturesOf(site);
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', config.lang);
    await expect(page).toHaveTitle(new RegExp(config.siteTitle.split(' ')[0]!));
    await expect(page.locator('h1').first()).toContainText(config.headerTitle.accent);
    // first slider is shown with posts from the mocked WP
    for (const slider of config.sliders.slice(0, 1)) {
      await expect(page.getByText(slider.label, { exact: false }).first()).toBeAttached();
    }
    await expect(page.locator('main a[href^="/post/"]').first()).toBeVisible();
    await expect(page.locator('footer')).toContainText(config.footer.contacts.phone);
    await expect(page.locator('footer')).toContainText(config.footer.copyright);
  });

  test('serves only this site and is noindex outside the production host', async ({ request }, info) => {
    const site = siteOf(info);
    const res = await request.get('/');
    expect(res.headers()['x-robots-tag']).toMatch(/noindex/);
    expect(await res.text()).toContain(`lang="${fixturesOf(site).config.lang}"`);
  });
});

test.describe('post', () => {
  test('renders, with canonical URL and category link', async ({ page }, info) => {
    const site = siteOf(info);
    const f = fixturesOf(site);
    const res = await page.goto(f.postPath);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText(f.post.title.rendered);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${f.config.domain}${f.postPath}`,
    );
    await expect(page.locator(`a[href="/category/${f.canon(f.mainCategory.slug)}"]`).first()).toBeAttached();
  });

  test('counts a view through /api/views → mock WP (once per IP+post)', async ({ page, request }, info) => {
    const site = siteOf(info);
    const f = fixturesOf(site);
    await resetViews(request);

    // The beacon must go to the app, not straight to WP, and answer 204.
    const beacon = page.waitForResponse((r) => r.url().endsWith(`/api/views/${f.post.id}`));
    await page.goto(f.postPath);
    expect((await beacon).status()).toBe(204);

    const mine = async () => (await viewLog(request)).filter((v) => v.id === f.post.id);
    await expect.poll(mine).toEqual([{ site, id: f.post.id }]);

    // A reload from the same client is dropped by the rate limiter: still one view.
    await page.reload();
    await page.waitForResponse((r) => r.url().endsWith(`/api/views/${f.post.id}`));
    await page.waitForTimeout(500);
    expect(await mine()).toHaveLength(1);
  });

  test('does not count views of bots', async ({ browser, request }, info) => {
    const site = siteOf(info);
    const f = fixturesOf(site);
    const id = f.otherPost.id;
    const ctx = await browser.newContext({
      baseURL: info.project.use.baseURL,
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    });
    const botPage = await ctx.newPage();
    const beacon = botPage.waitForResponse((r) => r.url().endsWith(`/api/views/${id}`));
    await botPage.goto(`/post/${id}-${f.canon(f.otherPost.slug)}`);
    expect((await beacon).status()).toBe(204);
    expect((await viewLog(request)).filter((v) => v.id === id)).toEqual([]);
    await ctx.close();
  });

  test('non-canonical URLs redirect to /post/{id}-{slug}', async ({ request }, info) => {
    const f = fixturesOf(siteOf(info));
    const noSlug = await request.get(`/post/${f.post.id}`, { maxRedirects: 0 });
    expect([301, 308]).toContain(noSlug.status());
    expect(new URL(firstLocation(noSlug.headers().location!), 'http://x').pathname).toBe(f.postPath);

    const wrongSlug = await request.get(`/post/${f.post.id}-wrong-slug`, { maxRedirects: 0 });
    expect([301, 308]).toContain(wrongSlug.status());
  });

  test('unknown post id is a real 404', async ({ request }) => {
    expect((await request.get('/post/999999999-nothing')).status()).toBe(404);
    expect((await request.get('/post/abc')).status()).toBe(404);
  });
});

test.describe('page', () => {
  test('renders a WP page', async ({ page }, info) => {
    const f = fixturesOf(siteOf(info));
    const res = await page.goto(f.pagePath);
    expect(res?.status()).toBe(200);
    await expect(page.locator('main')).toContainText(f.data.pages[0]!.title.rendered);
  });

  test('unknown page is 404', async ({ request }) => {
    expect((await request.get('/page/no-such-page')).status()).toBe(404);
  });
});

test.describe('category + pagination', () => {
  test('first page: 8 cards, pager, no /1 link', async ({ page }, info) => {
    const f = fixturesOf(siteOf(info));
    const dict = dictOf(siteOf(info));
    expect((await page.goto(f.categoryPath))?.status()).toBe(200);
    await expect(page.locator('main a[href^="/post/"] h3')).toHaveCount(8);
    const pager = page.getByRole('navigation', { name: dict.a11y.pagination });
    await expect(pager).toBeVisible();
    await expect(pager.locator('[aria-current="page"]')).toHaveText('1');
    await expect(pager.locator('a[href$="/1"]')).toHaveCount(0);
  });

  test('navigates to page 2 and back, via the pager', async ({ page }, info) => {
    const f = fixturesOf(siteOf(info));
    const dict = dictOf(siteOf(info));
    await page.goto(f.categoryPath);
    const pager = page.getByRole('navigation', { name: dict.a11y.pagination });
    await pager.getByRole('link', { name: dict.a11y.nextPage }).click();
    await expect(page).toHaveURL(`${info.project.use.baseURL}${f.categoryPath}/2`);
    await expect(pager.locator('[aria-current="page"]')).toHaveText('2');
    await pager.getByRole('link', { name: dict.a11y.prevPage }).click();
    await expect(page).toHaveURL(`${info.project.use.baseURL}${f.categoryPath}`);
  });

  test('last page has the remainder (30 posts + 2 special → 8/8/8/8/... ), past the end is 404', async ({
    page,
    request,
  }, info) => {
    const f = fixturesOf(siteOf(info));
    const total = f.data.posts.filter((p) => p._cat === f.mainCategory.id).length;
    const pages = Math.ceil(total / 8);
    expect((await page.goto(`${f.categoryPath}/${pages}`))?.status()).toBe(200);
    await expect(page.locator('main a[href^="/post/"] h3')).toHaveCount(total - (pages - 1) * 8);
    expect((await request.get(`${f.categoryPath}/${pages + 1}`)).status()).toBe(404);
    expect((await request.get(`${f.categoryPath}/0`)).status()).toBe(404);
    expect((await request.get(`${f.categoryPath}/abc`)).status()).toBe(404);
  });

  test('/category/x/1 redirects to /category/x; unknown category is 404', async ({ request }, info) => {
    const f = fixturesOf(siteOf(info));
    const r = await request.get(`${f.categoryPath}/1`, { maxRedirects: 0 });
    expect([301, 308]).toContain(r.status());
    expect((await request.get('/category/no-such-category')).status()).toBe(404);
  });
});

test.describe('search', () => {
  test('finds a post through the header form', async ({ page }, info) => {
    const site = siteOf(info);
    const f = fixturesOf(site);
    const dict = dictOf(site);
    await page.goto('/');
    await page.getByRole('searchbox', { name: dict.a11y.search }).fill(f.rareWord);
    await page.getByRole('searchbox', { name: dict.a11y.search }).press('Enter');
    await expect(page).toHaveURL(/\/search\?q=/);
    await expect(page.getByRole('heading', { level: 2 })).toContainText(dict.search.results);
    await expect(page.locator('main a[href^="/post/"] h3')).toHaveCount(1);
    await expect(page.locator('main mark').first()).toContainText(f.rareWord, { ignoreCase: true });
  });

  test('no results and empty query', async ({ page }, info) => {
    const dict = dictOf(siteOf(info));
    await page.goto('/search?q=zzzzqqqq');
    await expect(page.getByText(dict.search.noResults)).toBeVisible();
    await page.goto('/search');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(dict.search.enterQuery);
  });

  test('special characters are escaped, never executed', async ({ page }, info) => {
    const f = fixturesOf(siteOf(info));
    const dialogs: string[] = [];
    page.on('dialog', async (d) => {
      dialogs.push(d.message());
      await d.dismiss();
    });
    const payload = '<script>alert(1)</script>';
    await page.goto(`/search?q=${encodeURIComponent(payload)}`);
    // the query is echoed as text in the heading
    await expect(page.getByRole('heading', { level: 2 })).toContainText(payload);
    // and it matches the fixture whose title contains it — rendered as text, not as markup
    await expect(page.locator('main h3').first()).toContainText(payload);
    expect(await page.locator('main script').count()).toBe(0);
    expect(dialogs).toEqual([]);
    expect(f.special.title.rendered).toContain('&lt;script&gt;');
  });

  test.describe('odd queries never break the page', () => {
    for (const q of ['%', '%zz', '"', "'", '&', '&amp;', '\\', '.*', '(', '[', '?', '#', 'a'.repeat(500), '🙂', '  много   пробелов  ']) {
      test(`q=${q.slice(0, 20)}`, async ({ request }) => {
        const res = await request.get(`/search?q=${encodeURIComponent(q)}`);
        expect(res.status()).toBe(200);
      });
    }
  });

  test('raw malformed percent-encoding does not 5xx', async ({ request }) => {
    const res = await request.get('/search?q=%E0%A4%A');
    expect(res.status()).toBeLessThan(500);
  });

  test('search pagination and out-of-range page', async ({ page }, info) => {
    const f = fixturesOf(siteOf(info));
    const word = f.data.posts.find((p) => p.id < 9000)!.title.rendered.split(' ')[0]!; // "Пост"/"Articol": every generated post
    await page.goto(`/search?q=${encodeURIComponent(word)}`);
    await expect(page.locator('main a[href^="/post/"] h3')).toHaveCount(8);
    await page.goto(`/search?q=${encodeURIComponent(word)}&page=2`);
    await expect(page.locator('main a[href^="/post/"] h3').first()).toBeVisible();
    // Known gap: search renders inside <Suspense>, so `notFound()` after the shell gives 200
    // (a noindex page) instead of a real 404. Assert the user-visible result.
    await page.goto(`/search?q=${encodeURIComponent(word)}&page=999`);
    await expect(page.locator('main h1')).toContainText(dictOf(siteOf(info)).error.notFound);
  });
});

test.describe('404', () => {
  test('unknown path renders the site 404 with a real 404 status', async ({ page }, info) => {
    const dict = dictOf(siteOf(info));
    const res = await page.goto('/definitely/not/here');
    expect(res?.status()).toBe(404);
    await expect(page.locator('main h1')).toContainText(dict.error.notFound);
    // still inside the site layout
    await expect(page.locator('footer')).toBeVisible();
  });

  test('internal /ru, /ro prefixes are not reachable from outside', async ({ request }) => {
    expect((await request.get('/ru/post/1001-x')).status()).toBe(404);
    expect((await request.get('/ro')).status()).toBe(404);
  });
});

test.describe('legacy URL redirects', () => {
  const redirectOf = async (request: import('@playwright/test').APIRequestContext, url: string) => {
    const r = await request.get(url, { maxRedirects: 0 });
    return { status: r.status(), location: firstLocation(r.headers().location ?? '') };
  };

  test('/post?id= → /post/{id}-{slug}', async ({ request }, info) => {
    const f = fixturesOf(siteOf(info));
    const r = await redirectOf(request, `/post?id=${f.post.id}`);
    expect(r.status).toBe(301);
    expect(new URL(r.location, 'http://x').pathname).toBe(f.postPath);
  });

  test('/page?id= → /page/{slug}', async ({ request }, info) => {
    const f = fixturesOf(siteOf(info));
    const r = await redirectOf(request, `/page?id=${f.page.id}`);
    expect(r.status).toBe(301);
    expect(new URL(r.location, 'http://x').pathname).toBe(f.pagePath);
  });

  test('/category?id=&page= → /category/{slug}[/n]', async ({ request }, info) => {
    const f = fixturesOf(siteOf(info));
    const first = await redirectOf(request, `/category?id=${f.mainCategory.id}`);
    expect(first.status).toBe(301);
    expect(new URL(first.location, 'http://x').pathname).toBe(f.categoryPath);
    const second = await redirectOf(request, `/category?id=${f.mainCategory.id}&page=2`);
    expect(new URL(second.location, 'http://x').pathname).toBe(`${f.categoryPath}/2`);
  });

  test('/search?query= → /search?q= (other params kept, fbclid dropped)', async ({ request }) => {
    const r = await redirectOf(request, '/search?query=abc&utm_source=x&fbclid=zzz');
    expect(r.status).toBe(301);
    const u = new URL(r.location, 'http://x');
    expect(u.pathname).toBe('/search');
    expect(u.searchParams.get('q')).toBe('abc');
    expect(u.searchParams.get('utm_source')).toBe('x');
    expect(u.searchParams.has('fbclid')).toBe(false);
  });

  test('unknown or invalid ids → 404, no redirect', async ({ request }) => {
    for (const url of ['/post?id=999999999', '/page?id=999999999', '/category?id=999999999', '/post?id=abc']) {
      const r = await request.get(url, { maxRedirects: 0 });
      expect(r.status(), url).toBe(404);
    }
  });

  test('footer links (old ?id= form) end up on real pages', async ({ page }, info) => {
    const f = fixturesOf(siteOf(info));
    await page.goto('/');
    const href = `/page?id=${f.page.id}`;
    const link = page.locator(`footer a[href="${href}"]`);
    if ((await link.count()) === 0) test.skip(true, 'footer does not link this page on this site');
    await link.first().click();
    await expect(page).toHaveURL(new RegExp(`${f.pagePath.replace(/%/g, '%')}$`));
  });
});

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('burger opens and closes the drawer (button + Esc)', async ({ page }, info) => {
    const dict = dictOf(siteOf(info));
    await page.goto('/');
    const burger = page.getByRole('button', { name: dict.a11y.menu, exact: true });
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    const nav = page.getByRole('navigation', { name: dict.a11y.mainMenu });
    await expect(nav).toBeVisible();
    // submenu (accordion): the group from the mocked WPGraphQL menu
    const group = nav.getByRole('button', { name: 'Group' });
    await group.click();
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.locator('a[href^="/page/"]').first()).toBeVisible();

    await page.keyboard.press('Escape'); // closes the submenu first…
    await page.keyboard.press('Escape'); // …then the drawer
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
  });

  test('following a menu link navigates and closes the drawer', async ({ page }, info) => {
    const dict = dictOf(siteOf(info));
    await page.goto('/');
    const burger = page.getByRole('button', { name: dict.a11y.menu, exact: true });
    await burger.click();
    const nav = page.getByRole('navigation', { name: dict.a11y.mainMenu });
    await nav.getByRole('button', { name: 'Group' }).click();
    await nav.locator('a[href^="/page/"]').first().click();
    await expect(page).toHaveURL(/\/page\//);
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
  });
});
