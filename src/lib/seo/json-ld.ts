/**
 * schema.org JSON-LD builders (plain objects; the page serializes them with `<JsonLd>`).
 * Google's requirements: https://developers.google.com/search/docs/appearance/structured-data
 *   - NewsArticle: `headline` (≤ 110 chars), `image`, `datePublished`, `dateModified`, `author`;
 *   - BreadcrumbList: ≥ 2 `ListItem` with `position`, `name`, `item`;
 *   - WebSite SearchAction: `target` with `{search_term_string}` + `query-input`.
 */
import { absoluteUrl, type SiteConfig } from '@/config/sites';

export type JsonLd = Readonly<Record<string, unknown>>;

const CONTEXT = 'https://schema.org';
const HEADLINE_MAX = 110;

export const organizationId = (site: SiteConfig) => absoluteUrl(site, '/#organization');
export const websiteId = (site: SiteConfig) => absoluteUrl(site, '/#website');

export function organizationLd(site: SiteConfig): JsonLd {
  const { contacts, social } = site.footer;
  return {
    '@type': 'Organization',
    '@id': organizationId(site),
    name: site.siteTitle,
    url: absoluteUrl(site, '/'),
    logo: absoluteUrl(site, site.icons.icon512),
    sameAs: [social.facebook, social.youtube, social.instagram],
    address: {
      '@type': 'PostalAddress',
      streetAddress: contacts.address,
      addressCountry: 'MD',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: contacts.phone,
      email: contacts.email,
      availableLanguage: site.lang,
    },
  };
}

export function webSiteLd(site: SiteConfig): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': websiteId(site),
    url: absoluteUrl(site, '/'),
    name: site.siteTitle,
    inLanguage: site.lang,
    publisher: { '@id': organizationId(site) },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        // `{search_term_string}` must stay unescaped: it is the placeholder.
        urlTemplate: `${absoluteUrl(site, '/search')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Home page: Organization + WebSite in one `@graph`. */
export function homeLd(site: SiteConfig): JsonLd {
  return { '@context': CONTEXT, '@graph': [organizationLd(site), webSiteLd(site)] };
}

export interface Crumb {
  readonly name: string;
  /** Absolute URL. */
  readonly url: string;
}

export function breadcrumbLd(crumbs: readonly Crumb[]): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

export interface NewsArticleInput {
  readonly site: SiteConfig;
  readonly title: string;
  readonly description: string | null;
  /** Canonical absolute URL. */
  readonly url: string;
  /** Absolute image URL (featured image, else the site's default). */
  readonly image: string;
  /** UTC, ISO without zone (`date_gmt`). */
  readonly publishedGmt: string;
  readonly modifiedGmt: string;
  readonly section: string | null;
}

/** WP `*_gmt` (UTC, no zone) → ISO 8601 with `Z`; `undefined` when WP has no date. */
export function isoFromGmt(gmt: string): string | undefined {
  const date = new Date(`${gmt}Z`);
  return gmt && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
}

export function newsArticleLd(input: NewsArticleInput): JsonLd {
  const { site, url } = input;
  const published = isoFromGmt(input.publishedGmt);
  const modified = isoFromGmt(input.modifiedGmt) ?? published;
  return {
    '@context': CONTEXT,
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: truncate(input.title, HEADLINE_MAX),
    ...(input.description ? { description: input.description } : {}),
    image: [input.image],
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(input.section ? { articleSection: input.section } : {}),
    inLanguage: site.lang,
    // WP gives no byline in the data we load: the organization is the author.
    author: {
      '@type': 'Organization',
      '@id': organizationId(site),
      name: site.siteTitle,
      url: absoluteUrl(site, '/'),
    },
    publisher: {
      '@type': 'Organization',
      '@id': organizationId(site),
      name: site.siteTitle,
      logo: { '@type': 'ImageObject', url: absoluteUrl(site, site.icons.icon512) },
    },
  };
}

/**
 * JSON for an inline `<script type="application/ld+json">`. `<` is escaped so that
 * content such as `</script>` in a title can never close the tag; U+2028/2029 are
 * escaped for old JS parsers.
 */
const ESCAPES: readonly (readonly [RegExp, string])[] = [
  [/</g, '\\u003c'],
  [new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028'],
  [new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029'],
];

export function serializeJsonLd(data: JsonLd): string {
  return ESCAPES.reduce(
    (json, [pattern, replacement]) => json.replace(pattern, replacement),
    JSON.stringify(data),
  );
}
