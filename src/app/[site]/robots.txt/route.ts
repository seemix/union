import { headers } from 'next/headers';
import { robotsTxt } from '@/lib/seo/robots';
import { getRequestSite } from '@/lib/site/server';

/**
 * `/robots.txt` per domain. A route handler, not `robots.ts`: Next only serves `robots.ts`
 * from the root of `app/`, and the site comes from the Host (via `src/proxy.ts`).
 */
export async function GET(): Promise<Response> {
  const site = await getRequestSite();
  const host = (await headers()).get('host');
  return new Response(robotsTxt(site, host), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
