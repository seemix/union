import { headers } from 'next/headers';
import { getSite, isSiteId, type SiteConfig } from '@/config/sites';
import { SITE_HEADER } from './header';

/**
 * Site of the current request, as resolved by `src/proxy.ts`.
 * For route handlers (`/api/*`), which are not rewritten under `/[site]`.
 * Pages should use the `site` route param instead (keeps them static).
 */
export async function getRequestSite(): Promise<SiteConfig> {
  const id = (await headers()).get(SITE_HEADER);
  if (!isSiteId(id)) {
    throw new Error(`Missing or invalid "${SITE_HEADER}" header: is src/proxy.ts running?`);
  }
  return getSite(id);
}
