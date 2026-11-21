import type { Metadata } from 'next';
import { SITE_IDS, absoluteUrl, getSite, type SiteConfig } from '@/config/sites';
import type { ShareImage } from '@/lib/wp';

/** Meta description when a page has none of its own (ro has no site description yet). */
export function defaultDescription(site: SiteConfig): string {
  return site.description ?? site.siteTitle;
}

/** Default share image of the site (1200×630, `public/og/<id>.png`). */
export function defaultShareImage(site: SiteConfig): Required<ShareImage> {
  return {
    url: absoluteUrl(site, site.ogImage),
    width: 1200,
    height: 630,
    alt: site.siteTitle,
  };
}

export interface PageMeta {
  readonly site: SiteConfig;
  /** Page title without the site suffix (the layout's title template adds ` | siteTitle`). */
  readonly title: string;
  /** `true`: use `title` as is, without the template (home). */
  readonly absoluteTitle?: boolean;
  readonly description?: string | null;
  /** Canonical path on the production domain: `/post/1-x`, `/category/x/2`, `/`. */
  readonly path: string;
  readonly type?: 'website' | 'article';
  /** Own image (post thumbnail); the site's default image when absent. */
  readonly image?: ShareImage | null;
  readonly publishedTime?: string;
  readonly modifiedTime?: string;
  /** hreflang alternates (home only, Q7). */
  readonly languages?: Readonly<Record<string, string>>;
}

/**
 * The complete metadata of a content page. `openGraph` / `twitter` of a page replace the
 * layout's (Next merges them shallowly), so each page gets all fields — including the
 * default image — from this one function. The canonical always points to the production
 * domain, also when the page is served from staging (no duplicate canonicals).
 */
export function buildMetadata(meta: PageMeta): Metadata {
  const { site, title, path } = meta;
  const description = meta.description ?? defaultDescription(site);
  const url = absoluteUrl(site, path);
  const fallback = defaultShareImage(site);
  const image = meta.image?.url ? { ...meta.image, alt: meta.image.alt || title } : fallback;

  return {
    title: meta.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      ...(meta.languages ? { languages: { ...meta.languages } } : {}),
    },
    openGraph: {
      type: meta.type ?? 'website',
      url,
      title,
      description,
      siteName: site.siteTitle,
      locale: site.locale,
      images: [image],
      ...(meta.type === 'article'
        ? { publishedTime: meta.publishedTime, modifiedTime: meta.modifiedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}

/** `ru` ⇄ `ro` home pages: hreflang is set on the home page only (Q7). */
export function homeLanguages(): Record<string, string> {
  return Object.fromEntries(
    SITE_IDS.map((id) => {
      const s = getSite(id);
      return [s.lang, absoluteUrl(s, '/')];
    }),
  );
}
