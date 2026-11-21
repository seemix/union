import type { MetadataRoute } from 'next';
import { absoluteUrl, type SiteConfig } from '@/config/sites';
import { categoryHref, pageHref, postHref } from '@/lib/site/href';
import type { SitemapCategoryRow, SitemapPageRow, SitemapPostRow } from '@/lib/wp/sitemap';

type Entry = MetadataRoute.Sitemap[number];

/** WP `*_gmt` fields are UTC without a zone; `undefined` for WP's zero date or garbage. */
function lastModified(gmt: string | undefined): Date | undefined {
  if (!gmt) return undefined;
  const date = new Date(`${gmt}Z`);
  return Number.isNaN(date.getTime()) || date.getUTCFullYear() < 1990 ? undefined : date;
}

/** Sitemap 0: home, non-empty categories (page 1; later pages are reached by links), pages. */
export function staticEntries(
  site: SiteConfig,
  categories: readonly SitemapCategoryRow[],
  pages: readonly SitemapPageRow[],
): Entry[] {
  const seen = new Set<string>();
  const entries: Entry[] = [];
  const add = (path: string, modified?: Date) => {
    const url = absoluteUrl(site, path);
    if (seen.has(url)) return;
    seen.add(url);
    entries.push(modified ? { url, lastModified: modified } : { url });
  };

  add('/');
  for (const c of categories) if (c.slug) add(categoryHref(c));
  // WP allows equal slugs under different parents; `/page/{slug}` resolves one of them.
  for (const p of pages) if (p.slug) add(pageHref(p), lastModified(p.modified_gmt));
  return entries;
}

/** Sitemaps 1…n: one entry per post at its canonical `/post/{id}-{slug}` URL. */
export function postEntries(site: SiteConfig, posts: readonly SitemapPostRow[]): Entry[] {
  return posts.map((p) => ({
    url: absoluteUrl(site, postHref(p)),
    lastModified: lastModified(p.modified_gmt),
  }));
}

/** Absolute URL of sitemap `id` (`/sitemap/{id}.xml`, the Next `generateSitemaps` layout). */
export function sitemapUrl(site: SiteConfig, id: number): string {
  return absoluteUrl(site, `/sitemap/${id}.xml`);
}

const XML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]!);

/** sitemaps.org `<urlset>` document. */
export function urlsetXml(entries: readonly Entry[]): string {
  const urls = entries.map((e) => {
    const lastmod = e.lastModified
      ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>`
      : '';
    return `<url><loc>${escapeXml(e.url)}</loc>${lastmod}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}

/** sitemaps.org `<sitemapindex>` of `count` sitemap files (ids `0…count-1`). */
export function sitemapIndexXml(site: SiteConfig, count: number): string {
  const items = Array.from(
    { length: count },
    (_, id) => `<sitemap><loc>${escapeXml(sitemapUrl(site, id))}</loc></sitemap>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.join('')}</sitemapindex>\n`;
}

/** `3.xml` → 3; anything else (`03.xml`, `x.xml`, `3`) → `null` (404). */
export function parseSitemapFile(file: string): number | null {
  const m = /^(0|[1-9]\d{0,3})\.xml$/.exec(file);
  return m ? Number(m[1]) : null;
}
