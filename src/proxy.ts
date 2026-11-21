import { NextResponse, type NextRequest } from 'next/server';
import { getSite, isProductionHost, isSiteId, siteByHost, type SiteConfig } from '@/config/sites';
import { lookupSlug } from '@/lib/legacy/lookup';
import { resolveLegacy } from '@/lib/legacy/redirects';
import { SITE_HEADER } from '@/lib/site/header';

/**
 * Multi-site routing (see docs/ARCHITECTURE.md):
 *   Host → site → internal rewrite `/<path>` → `/<site>/<path>`.
 * `/api/*` is not rewritten; it only receives the `x-site` request header.
 */
export async function proxy(request: NextRequest) {
  const response = await route(request);
  // Only the production domain may be indexed: staging (`next.*`), localhost, etc. never.
  if (!isProductionHost(request.headers.get('host'))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

async function route(request: NextRequest): Promise<NextResponse> {
  const site = resolveSite(request);
  if (!site) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  // Always overwrite: never trust an `x-site` sent by the client.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SITE_HEADER, site.id);

  const { pathname } = request.nextUrl;

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const legacy = await legacyRedirect(request, site);
  if (legacy === 'not_found') return renderNotFound(request, site, requestHeaders);
  if (legacy) return legacy;

  // `/ru/...`, `/ro/...` are internal paths: requested from outside they would
  // duplicate pages (or expose the other site), so they always 404.
  if (isSiteId(pathname.split('/')[1])) return renderNotFound(request, site, requestHeaders);

  const url = request.nextUrl.clone();
  url.pathname = `/${site.id}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

/**
 * `[site]/[...rest]` renders the 404 inside the current site's layout. The status is set
 * here as well, not only by the page's `notFound()` (which `next dev` answers with `200`).
 */
function renderNotFound(request: NextRequest, site: SiteConfig, headers: Headers): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = `/${site.id}/_not-found`;
  url.search = '';
  return NextResponse.rewrite(url, { status: 404, request: { headers } });
}

function resolveSite(request: NextRequest): SiteConfig | null {
  if (process.env.NODE_ENV !== 'production') {
    const override = process.env.SITE_OVERRIDE?.trim();
    if (override) {
      if (isSiteId(override)) return getSite(override);
      console.warn(`[proxy] Ignoring invalid SITE_OVERRIDE="${override}" (allowed: ru | ro)`);
    }
  }
  return siteByHost(request.headers.get('host'));
}

/**
 * Stage 5: 301 redirects for legacy URLs `/post?id=`, `/page?id=`, `/category?id=&page=`,
 * `/search?query=` (src/lib/legacy/redirects.ts). `null` → not a legacy URL, continue.
 */
async function legacyRedirect(
  request: NextRequest,
  site: SiteConfig,
): Promise<NextResponse | 'not_found' | null> {
  const { pathname, searchParams } = request.nextUrl;
  const action = await resolveLegacy(pathname, searchParams, site.id, lookupSlug);
  if (!action) return null;
  switch (action.type) {
    case 'not_found':
      return 'not_found';
    case 'unavailable':
      // WP is down and a page/category has no id route to fall back to: a temporary
      // error, so crawlers keep the old URL and retry.
      return new NextResponse('Service Unavailable', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '60' },
      });
    case 'redirect':
      return NextResponse.redirect(new URL(action.location, request.nextUrl), action.status);
  }
}

export const config = {
  matcher: [
    // Everything except Next internals, metadata files and static files from `public/`.
    // `/api` is matched on purpose: it needs the `x-site` header (no rewrite there).
    '/((?!_next/|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|.*\\.(?:avif|webp|png|jpe?g|gif|svg|ico|css|js|map|txt|xml|json|webmanifest|woff2?|ttf|otf|pdf|mp4|webm)$).*)',
    // Metadata routes whose extension the pattern above treats as a static file: they are
    // per-site (`app/[site]/…`), so they need the Host → site rewrite and `x-site`.
    '/favicon.ico',
    '/robots.txt',
    '/sitemap_index.xml',
    '/sitemap/:path*',
    '/manifest.webmanifest',
  ],
};
