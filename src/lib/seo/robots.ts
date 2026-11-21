import { isProductionHost, type SiteConfig } from '@/config/sites';
import { sitemapUrl } from './sitemap';

/**
 * robots.txt of one domain. Production: everything but `/api/` is open and the site's own
 * sitemaps are listed (`sitemapCount` = id 0 + one per post chunk). Any other host
 * (staging `next.*`, localhost, unknown) is closed completely; `src/proxy.ts` also sends
 * `X-Robots-Tag: noindex` there.
 */
export function robotsTxt(site: SiteConfig, host: string | null, sitemapCount: number): string {
  if (!isProductionHost(host)) return 'User-Agent: *\nDisallow: /\n';
  const lines = ['User-Agent: *', 'Allow: /', 'Disallow: /api/', ''];
  for (let id = 0; id < sitemapCount; id++) lines.push(`Sitemap: ${sitemapUrl(site, id)}`);
  return `${lines.join('\n')}\n`;
}
