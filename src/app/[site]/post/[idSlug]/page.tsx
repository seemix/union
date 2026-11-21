import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getSite, isSiteId, type SiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
import { formatDate, formatNumber } from '@/i18n/format';
import { categoryHref, parsePostIdSlug, postHref, slugForUrl } from '@/lib/site/href';
import { getPost, getPosts, plainText, shareImage, type WpPost } from '@/lib/wp';
import { ContentRender } from '../../_components/ContentRender/ContentRender';
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

const DESCRIPTION_MAX = 160;

/** Excerpt as plain text without WP's trailing `[…]`, cut on a word boundary. */
function describe(post: WpPost): string | null {
  const text = plainText(post.excerpt.rendered)
    .replace(/\s*\[(?:…|\.\.\.)\]\s*$/, '')
    .trim();
  if (!text) return null;
  if (text.length <= DESCRIPTION_MAX) return text;
  const cut = text.slice(0, DESCRIPTION_MAX - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > DESCRIPTION_MAX / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

/** WP `*_gmt` fields are UTC without a zone. */
const utc = (gmt: string) => (gmt ? `${gmt}Z` : undefined);

export async function generateMetadata({
  params,
}: PageProps<'/[site]/post/[idSlug]'>): Promise<Metadata> {
  const { site: siteParam, idSlug } = await params;
  const { site: siteId, post } = await loadPost(siteParam, idSlug);
  const site = getSite(siteId);

  const title = plainText(post.title.rendered);
  const description = describe(post) ?? site.description ?? undefined;
  // Always the production domain, also on staging (no duplicate canonicals).
  const url = `${site.domain}${postHref(post)}`;
  const image = shareImage(post);
  const images = image ? [{ ...image, alt: image.alt || title }] : undefined;

  return {
    title: `${title} | ${site.siteTitle}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: site.siteTitle,
      locale: site.locale,
      publishedTime: utc(post.date_gmt),
      modifiedTime: utc(post.modified_gmt),
      images,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

export default async function PostPage({ params }: PageProps<'/[site]/post/[idSlug]'>) {
  const { site: siteParam, idSlug } = await params;
  const { site, post } = await loadPost(siteParam, idSlug);
  const dict = await getDictionary(site);

  const categories = (post._embedded?.['wp:term']?.[0] ?? []).filter(
    (t) => t.taxonomy === 'category',
  );

  return (
    <div className="main">
      <div className={css.categories_wrapper}>
        {categories.map((c) => (
          <Link key={c.id} href={categoryHref(c)}>
            {plainText(c.name)}
          </Link>
        ))}
      </div>
      <h2>{plainText(post.title.rendered)}</h2>
      <DateViews
        // Value as cached with the post; live counts come with P4.7.
        views={post.views > 0 ? formatNumber(post.views, site) : null}
        date={formatDate(post.date, site)}
        viewsLabel={dict.a11y.views}
      />
      <ContentRender html={post.content.rendered} />
      <PostViewCounter postId={post.id} />
    </div>
  );
}
