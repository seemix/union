import { NextResponse, type NextRequest } from 'next/server';
import { getSite, isSiteId, siteByHost, type SiteConfig } from '@/config/sites';
import { SITE_HEADER } from '@/lib/site/header';

/**
 * Multi-site routing (see docs/ARCHITECTURE.md):
 *   Host → site → internal rewrite `/<path>` → `/<site>/<path>`.
 * `/api/*` is not rewritten; it only receives the `x-site` request header.
 */
export function proxy(request: NextRequest) {
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

  const legacy = legacyRedirect(request, site);
  if (legacy) return legacy;

  const url = request.nextUrl.clone();
  // `/ru/...`, `/ro/...` are internal paths: requested from outside they would
  // duplicate pages (or expose the other site), so they always 404.
  // `[site]/[...rest]` renders the 404 inside the current site's layout.
  url.pathname = isSiteId(pathname.split('/')[1])
    ? `/${site.id}/_not-found`
    : `/${site.id}${pathname === '/' ? '' : pathname}`;

  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
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
 * Stage 5 (ROADMAP): 301 redirects for legacy URLs
 * `/post?id=`, `/page?id=`, `/category?id=&page=`, `/search?query=`.
 * Return a redirect response, or `null` to continue with the rewrite.
 */
function legacyRedirect(request: NextRequest, site: SiteConfig): NextResponse | null {
  // TODO(stage 5): implement legacy URL redirects (with id→slug lookup cache).
  void request;
  void site;
  return null;
}

export const config = {
  matcher: [
    // Everything except Next internals, metadata files and static files from `public/`.
    // `/api` is matched on purpose: it needs the `x-site` header (no rewrite there).
    '/((?!_next/|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|.*\\.(?:avif|webp|png|jpe?g|gif|svg|ico|css|js|map|txt|xml|json|webmanifest|woff2?|ttf|otf|pdf|mp4|webm)$).*)',
  ],
};
