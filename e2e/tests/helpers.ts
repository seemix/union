import { expect, type APIRequestContext, type TestInfo } from '@playwright/test';
import { DATA, RARE_WORD } from '../mock-wp/fixtures.mjs';
import { ro } from '../../src/i18n/ro';
import { ru } from '../../src/i18n/ru';
import { getSite, type SiteId } from '../../src/config/sites';

export const MOCK_URL = `http://127.0.0.1:${process.env.MOCK_WP_PORT ?? '4010'}`;

/** Slug as the app emits it in URLs: percent-encoded, upper-case hex. */
const canon = (slug: string) => encodeURIComponent(decodeURIComponent(slug));

export function siteOf(info: TestInfo): SiteId {
  return info.project.metadata.site as SiteId;
}

export const dictOf = (site: SiteId) => (site === 'ru' ? ru : ro);

/** Everything a test needs to know about a site's fixtures. */
export function fixturesOf(site: SiteId) {
  const data = DATA[site];
  const config = getSite(site);
  const mainCategory = data.categories[0]!; // 30 posts → 4 pages of 8
  const firstInCategory = (catId: number) => data.posts.find((p) => p._cat === catId)!;
  // A post with an image, not one of the special search fixtures.
  const post = data.posts.find((p) => p._cat === mainCategory.id && p._withImage && p.id < 9000)!;
  const page = data.pages[0]!;
  return {
    data,
    config,
    mainCategory,
    post,
    page,
    special: data.posts.find((p) => p.id === 9001)!,
    rareWord: RARE_WORD[site],
    postPath: `/post/${post.id}-${canon(post.slug)}`,
    pagePath: `/page/${canon(page.slug)}`,
    categoryPath: `/category/${canon(mainCategory.slug)}`,
    firstInCategory,
    otherPost: data.posts.find((p) => p.id !== post.id && p.id < 9000 && p._cat === mainCategory.id)!,
    canon,
  };
}

export async function resetViews(request: APIRequestContext) {
  await expect((await request.get(`${MOCK_URL}/__mock/reset`)).ok()).toBe(true);
}

export async function viewLog(request: APIRequestContext): Promise<{ site: string; id: number }[]> {
  return (await request.get(`${MOCK_URL}/__mock/views`)).json();
}
