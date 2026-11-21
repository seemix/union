import { webManifest } from '@/lib/seo/manifest';
import { getRequestSite } from '@/lib/site/server';

/** `/manifest.webmanifest` of the site the request is for (`manifest.ts` is root-only). */
export async function GET(): Promise<Response> {
  const manifest = webManifest(await getRequestSite());
  return new Response(JSON.stringify(manifest), {
    headers: {
      'content-type': 'application/manifest+json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
