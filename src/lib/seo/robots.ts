import { absoluteUrl, isProductionHost, type SiteConfig } from '@/config/sites';

/**
 * robots.txt of one domain. Production: everything but `/api/` is open and only the site's
 * sitemap index is listed — it names every `/sitemap/{id}.xml` itself, so robots.txt never
 * needs WP (a WP outage must not turn robots.txt into a 5xx, which crawlers read as
 * "disallow everything"). Any other host (staging `next.*`, localhost, unknown) is closed
 * completely; `src/proxy.ts` also sends `X-Robots-Tag: noindex` there.
 */
export function robotsTxt(site: SiteConfig, host: string | null): string {
  if (!isProductionHost(host)) return 'User-Agent: *\nDisallow: /\n';
  return [
    'User-Agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${absoluteUrl(site, '/sitemap_index.xml')}`,
    '',
  ].join('\n');
}
