import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getSite, isSiteId, type SiteId } from '@/config/sites';
import { pageHref, slugForUrl } from '@/lib/site/href';
import { getPage, metaDescription, plainText, type WpPage } from '@/lib/wp';
import { ContentRender } from '../../_components/ContentRender/ContentRender';

/**
 * `/page/{slug}` (Q6). Same static-output rules as `/post/[idSlug]`: a slug not
 * prerendered at build is rendered completely before the response starts, so a missing
 * page is a real 404 (not `200` + `noindex`).
 */
export const ensureStatic = 'navigation';

// WP has no cheap "list all pages" in the data layer; footer/widget pages are reached by
// id and redirected here. `ensureStatic` needs one entry: a 404 placeholder will do.
export function generateStaticParams(): { slug: string }[] {
  return [{ slug: '0' }];
}

/**
 * Shared by the page and `generateMetadata`: `cache()` makes it one lookup per request
 * (and `getPage` itself is a tagged `use cache` getter). Missing → 404; the slug spelled
 * differently from WP's (case, encoding) → 308 to the canonical `/page/{slug}`.
 */
const loadPage = cache(
  async (siteParam: string, slug: string): Promise<{ site: SiteId; page: WpPage }> => {
    if (!isSiteId(siteParam)) notFound();
    const page = await getPage(siteParam, slug);
    if (!page) notFound();
    if (!slugForUrl(page.slug, slug).matches) permanentRedirect(pageHref(page));
    return { site: siteParam, page };
  },
);

export async function generateMetadata({
  params,
}: PageProps<'/[site]/page/[slug]'>): Promise<Metadata> {
  const { site: siteParam, slug } = await params;
  const { site: siteId, page } = await loadPage(siteParam, slug);
  const site = getSite(siteId);

  const title = plainText(page.title.rendered);
  const description =
    metaDescription(page.excerpt.rendered) ??
    metaDescription(page.content.rendered) ??
    site.description;
  // Always the production domain, also on staging (no duplicate canonicals).
  const url = `${site.domain}${pageHref(page)}`;

  return {
    title: `${title} | ${site.siteTitle}`,
    description: description ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description: description ?? undefined,
      siteName: site.siteTitle,
      locale: site.locale,
    },
  };
}

export default async function WpPageView({ params }: PageProps<'/[site]/page/[slug]'>) {
  const { site, slug } = await params;
  const { page } = await loadPage(site, slug);

  return (
    <div className="main">
      <h2>{plainText(page.title.rendered)}</h2>
      <ContentRender html={page.content.rendered} />
    </div>
  );
}
