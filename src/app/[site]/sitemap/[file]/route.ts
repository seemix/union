import { notFound } from 'next/navigation';
import { parseSitemapFile, postEntries, staticEntries, urlsetXml } from '@/lib/seo/sitemap';
import { getRequestSite } from '@/lib/site/server';
import {
  getPostChunkCount,
  getSitemapCategories,
  getSitemapPages,
  getSitemapPosts,
} from '@/lib/wp/sitemap';

/**
 * `/sitemap/{id}.xml`, ≤ 5000 URLs each: id 0 = home + categories + pages, ids 1…n = posts
 * (src/lib/wp/sitemap.ts). The same split as `generateSitemaps` of `app/sitemap.ts`, built
 * by hand: Next's `sitemap.ts` convention gets no route params (it cannot tell the sites
 * apart) and is prerendered through its own `generateStaticParams`, so it cannot read the
 * `x-site` header that `src/proxy.ts` sets. This handler is dynamic; the WP reads below
 * are `use cache`d and tagged, so a request is cheap and revalidation (stage 4) reaches it.
 * An id past the last chunk is a real 404, never an empty sitemap.
 */
export async function GET(_request: Request, ctx: RouteContext<'/[site]/sitemap/[file]'>) {
  const id = parseSitemapFile((await ctx.params).file);
  if (id === null) notFound();
  const site = await getRequestSite();

  let entries;
  if (id === 0) {
    const [categories, pages] = await Promise.all([
      getSitemapCategories(site.id),
      getSitemapPages(site.id),
    ]);
    entries = staticEntries(site, categories, pages);
  } else {
    if (id > (await getPostChunkCount(site.id))) notFound();
    entries = postEntries(site, await getSitemapPosts(site.id, id - 1));
  }

  return new Response(urlsetXml(entries), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
