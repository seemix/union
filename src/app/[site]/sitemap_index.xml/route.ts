import { sitemapIndexXml } from '@/lib/seo/sitemap';
import { getRequestSite } from '@/lib/site/server';
import { getPostChunkCount } from '@/lib/wp/sitemap';

/** Sitemap index: one URL to submit (Search Console) instead of every `/sitemap/{id}.xml`. */
export async function GET(): Promise<Response> {
  const site = await getRequestSite();
  const xml = sitemapIndexXml(site, 1 + (await getPostChunkCount(site.id)));
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
