import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { absoluteUrl, getSite, isSiteId, type SiteConfig, type SiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
import { formatDate, formatNumber } from '@/i18n/format';
import { breadcrumbLd, isoFromGmt, newsArticleLd } from '@/lib/seo/json-ld';
import { buildMetadata, defaultDescription, defaultShareImage } from '@/lib/seo/metadata';
import { categoryHref, parsePostIdSlug, postHref, slugForUrl } from '@/lib/site/href';
import { getPost, getPosts, metaDescription, plainText, shareImage, type WpPost } from '@/lib/wp';
import { ContentRender } from '../../_components/ContentRender/ContentRender';
import { JsonLd } from '../../_components/JsonLd/JsonLd';
import { DateViews } from '../../_components/DateViews/DateViews';
import { PostViewCounter } from '../../_components/PostViewCounter/PostViewCounter';
import css from './post.module.css';

/**
 * `/post/{id}-{slug}` (Q3).
 *
 * Caching: the page is static output built from the cached `getPost()`, which carries
 * the `post:{site}:{id}` tag (src/lib/wp/tags.ts) — `revalidateTag` of it rebuilds the page.
 *
 * `ensureStatic = 'navigation'`: an id not prerendered at build is rendered completely
 * before the response starts (no App Shell first). That is what keeps real HTTP
 * statuses: with Cache Components a `notFound()`/redirect after the shell is sent ends
 * up as `200` + `noindex` / a client-side redirect. The result (page, 404 or 308) is
 * then cached for the next visitors.
 */
export const ensureStatic = 'navigation';

/** Newest posts are prerendered at build; any other id is rendered (and cached) on first visit. */
const PRERENDER_COUNT = 10;

export async function generateStaticParams({
  params,
}: {
  params: { site: string };
}): Promise<{ idSlug: string }[]> {
  if (!isSiteId(params.site)) return [];
  const latest = await getPosts(params.site, { perPage: PRERENDER_COUNT });
  const items = latest?.items ?? [];
  // `ensureStatic = 'navigation'` needs at least one entry; a 404 placeholder will do.
  if (items.length === 0) return [{ idSlug: '0' }];
  // Decoded form: Next encodes params itself when building the path.
  return items.map((p) => ({ idSlug: decodeURIComponent(postHref(p).slice('/post/'.length)) }));
}

/**
 * Shared by the page and `generateMetadata` (`getPost` is cached, so one WP request).
 * Invalid id / missing / not published → 404; non-canonical URL → 308 to `/post/{id}-{slug}`.
 */
async function loadPost(
  siteParam: string,
  idSlug: string,
): Promise<{ site: SiteId; post: WpPost }> {
  if (!isSiteId(siteParam)) notFound();
  const parsed = parsePostIdSlug(idSlug);
  if (!parsed) notFound();

  const post = await getPost(siteParam, parsed.id);
  if (!post || post.status !== 'publish') notFound();

  const { matches } = slugForUrl(post.slug, parsed.slug ?? '');
  const canonical =
    parsed.rawId === String(post.id) &&
    matches &&
    // `/post/7` only when WP has no slug, `/post/7-` never.
    (parsed.slug === null) === (post.slug === '');
  if (!canonical) permanentRedirect(postHref(post));

  return { site: siteParam, post };
}

/** Excerpt as plain text without WP's trailing `[…]`, cut on a word boundary. */
const describe = (post: WpPost): string | null => metaDescription(post.excerpt.rendered);

/** Some posts have no title at all (ro 14853): metadata and JSON-LD need one, so use the site's. */
const seoTitle = (post: WpPost, site: SiteConfig) =>
  plainText(post.title.rendered) || site.siteTitle;

export async function generateMetadata({
  params,
}: PageProps<'/[site]/post/[idSlug]'>): Promise<Metadata> {
  const { site: siteParam, idSlug } = await params;
  const { site: siteId, post } = await loadPost(siteParam, idSlug);
  const site = getSite(siteId);

  return buildMetadata({
    site,
    title: seoTitle(post, site),
    description: describe(post),
    path: postHref(post),
    type: 'article',
    image: shareImage(post),
    publishedTime: isoFromGmt(post.date_gmt),
    modifiedTime: isoFromGmt(post.modified_gmt),
  });
}

export default async function PostPage({ params }: PageProps<'/[site]/post/[idSlug]'>) {
  const { site: siteParam, idSlug } = await params;
  const { site, post } = await loadPost(siteParam, idSlug);
  const dict = await getDictionary(site);

  const siteConfig = getSite(site);
  const title = seoTitle(post, siteConfig);
  const url = absoluteUrl(siteConfig, postHref(post));
  const categories = (post._embedded?.['wp:term']?.[0] ?? []).filter(
    (t) => t.taxonomy === 'category',
  );

  const firstCategory = categories[0];
  const image = shareImage(post)?.url ?? defaultShareImage(siteConfig).url;

  return (
    <div className="main">
      <JsonLd
        data={newsArticleLd({
          site: siteConfig,
          title,
          description: describe(post) ?? defaultDescription(siteConfig),
          url,
          image,
          publishedGmt: post.date_gmt,
          modifiedGmt: post.modified_gmt,
          section: firstCategory ? plainText(firstCategory.name) : null,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: dict.breadcrumb.home, url: absoluteUrl(siteConfig, '/') },
          ...(firstCategory
            ? [
                {
                  name: plainText(firstCategory.name),
                  url: absoluteUrl(siteConfig, categoryHref(firstCategory)),
                },
              ]
            : []),
          { name: title, url },
        ])}
      />
      <div className={css.categories_wrapper}>
        {categories.map((c) => (
          <Link key={c.id} href={categoryHref(c)}>
            {plainText(c.name)}
          </Link>
        ))}
      </div>
      <h2>{plainText(post.title.rendered)}</h2>
      <DateViews
        // Value as cached with the post (refreshed with it); PostViewCounter only increments.
        views={post.views > 0 ? formatNumber(post.views, site) : null}
        date={formatDate(post.date, site)}
        viewsLabel={dict.a11y.views}
      />
      <ContentRender html={post.content.rendered} site={site} />
      <PostViewCounter postId={post.id} />
    </div>
  );
}
