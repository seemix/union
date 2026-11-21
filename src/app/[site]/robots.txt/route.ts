import { headers } from 'next/headers';
import { isProductionHost } from '@/config/sites';
import { robotsTxt } from '@/lib/seo/robots';
import { getRequestSite } from '@/lib/site/server';
import { getPostChunkCount } from '@/lib/wp/sitemap';

/**
 * `/robots.txt` per domain. A route handler, not `robots.ts`: Next only serves `robots.ts`
 * from the root of `app/`, and the site comes from the Host (via `src/proxy.ts`).
 */
export async function GET(): Promise<Response> {
  const site = await getRequestSite();
  const host = (await headers()).get('host');
  // Staging is closed without touching WP; production lists the real sitemaps.
  const count = isProductionHost(host) ? 1 + (await getPostChunkCount(site.id)) : 0;
  return new Response(robotsTxt(site, host, count), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
