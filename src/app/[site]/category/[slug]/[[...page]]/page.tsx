import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { absoluteUrl, getSite, isSiteId, type SiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
import { breadcrumbLd } from '@/lib/seo/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { categoryHref, parseListPage, slugForUrl } from '@/lib/site/href';
import {
  DEFAULT_PER_PAGE,
  getCategoryBySlug,
  getPosts,
  metaDescription,
  plainText,
  type WpCategory,
  type WpList,
  type WpPostSummary,
} from '@/lib/wp';
import { JsonLd } from '../../../_components/JsonLd/JsonLd';
import { Pagination } from '../../../_components/Pagination/Pagination';
import { PostGrid } from '../../../_components/PostCard/PostGrid';

/**
 * `/category/{slug}` and `/category/{slug}/{n}` (n ≥ 2). Same static-output rules as
 * `/post/[idSlug]`: anything not prerendered at build is rendered completely before the
 * response starts, so 404 / 308 are real HTTP statuses.
 */
export const ensureStatic = 'navigation';

// `ensureStatic` needs one entry; a 404 placeholder will do. Real categories and pages
// are rendered on first visit and then cached (tags: `category:{site}:{id}`, `posts:{site}`).
export function generateStaticParams(): { slug: string; page: string[] }[] {
  return [{ slug: '0', page: [] }];
}

interface CategoryView {
  readonly site: SiteId;
  readonly category: WpCategory;
  readonly page: number;
  readonly list: WpList<WpPostSummary>;
}

/**
 * The one loader for `generateMetadata` and the page; `cache()` runs it once per request,
 * so the category (name for the title) is never fetched twice — the name comes from the
 * same `getCategoryBySlug` result that resolves the posts' category id.
 *
 * 404: unknown category, page not a number / `0` / past the last page.
 * 308: `/…/1` → `/category/{slug}`, zero-padded numbers, a slug spelled differently from WP's.
 */
const loadCategory = cache(
  async (
    siteParam: string,
    slug: string,
    segments: readonly string[] | undefined,
  ): Promise<CategoryView> => {
    if (!isSiteId(siteParam)) notFound();
    const parsed = parseListPage(segments);
    if (!parsed) notFound();

    const category = await getCategoryBySlug(siteParam, slug);
    if (!category) notFound();

    if (!parsed.canonical || !slugForUrl(category.slug, slug).matches) {
      permanentRedirect(categoryHref(category, parsed.page));
    }

    // `null` = page past the end. An empty category is page 1 with no items (not a 404).
    const list = await getPosts(siteParam, {
      categories: [category.id],
      page: parsed.page,
      perPage: DEFAULT_PER_PAGE,
    });
    if (!list || parsed.page > Math.max(list.totalPages, 1)) notFound();

    return { site: siteParam, category, page: parsed.page, list };
  },
);

export async function generateMetadata({
  params,
}: PageProps<'/[site]/category/[slug]/[[...page]]'>): Promise<Metadata> {
  const { site: siteParam, slug, page: segments } = await params;
  const { site: siteId, category, page } = await loadCategory(siteParam, slug, segments);
  const site = getSite(siteId);
  const dict = await getDictionary(siteId);

  const name = plainText(category.name);
  const heading = page > 1 ? `${name} — ${dict.pagination.page} ${page}` : name;
  return buildMetadata({
    site,
    title: heading,
    description: metaDescription(category.description),
    // Each pagination page is canonical to itself.
    path: categoryHref(category, page),
  });
}

export default async function CategoryPage({
  params,
}: PageProps<'/[site]/category/[slug]/[[...page]]'>) {
  const { site: siteParam, slug, page: segments } = await params;
  const { site, category, page, list } = await loadCategory(siteParam, slug, segments);
  const dict = await getDictionary(site);
  const siteConfig = getSite(site);

  return (
    <div className="main">
      <JsonLd
        data={breadcrumbLd([
          { name: dict.breadcrumb.home, url: absoluteUrl(siteConfig, '/') },
          { name: plainText(category.name), url: absoluteUrl(siteConfig, categoryHref(category)) },
        ])}
      />
      <h2>{plainText(category.name)}</h2>
      <PostGrid posts={list.items} site={site} dict={dict} />
      <Pagination
        current={page}
        total={list.totalPages}
        basePath={categoryHref(category)}
        label={dict.a11y.pagination}
        prevLabel={dict.a11y.prevPage}
        nextLabel={dict.a11y.nextPage}
        pageLabel={dict.a11y.page}
      />
    </div>
  );
}
