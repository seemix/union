/**
 * Hrefs inside WP post/page HTML → v2 routes. Pure (no Next imports), unit-tested.
 *
 * - relative legacy `/post?id=`, `/page?id=`, `/category?id=` → same route (proxy redirects)
 * - `baptist.org.md/{ru|ro}/…` and the site domains → v2 route of that site
 *   (the other site's route gets that site's domain, so it is an external link)
 * - everything else → external, unchanged
 * - `javascript:`-like schemes → `null` (the attribute is dropped)
 */
import { SITE_IDS, getSite, type SiteConfig, type SiteId } from '@/config/sites';
import { resolveMenuHref } from './menu-url';

export interface ContentHref {
  readonly href: string;
  readonly external: boolean;
}

const WP_HOST = 'baptist.org.md';
const UNSAFE_SCHEME = /^(?:javascript|vbscript|data):/i;
const LEGACY_ROUTE = /^\/(post|page|category)\/?$/;

/** Browsers ignore tabs/newlines/control chars inside a scheme (`java\tscript:`). */
export function stripUrlNoise(value: string): string {
  return value.replace(/[\u0000- \u007f-\u009f]+/g, '');
}

export function isUnsafeUrl(value: string): boolean {
  return UNSAFE_SCHEME.test(stripUrlNoise(value));
}

function siteOfHost(hostname: string): SiteConfig | null {
  for (const id of SITE_IDS) {
    const s = getSite(id);
    if (hostname === new URL(s.domain).hostname || hostname === new URL(s.stagingDomain).hostname) {
      return s;
    }
  }
  return null;
}

function legacyIdRoute(url: URL): string | null {
  const m = LEGACY_ROUTE.exec(url.pathname);
  const id = url.searchParams.get('id');
  return m && id && /^\d{1,15}$/.test(id) ? `/${m[1]}?id=${Number(id)}` : null;
}

export function resolveContentHref(raw: string, site: SiteId): ContentHref | null {
  const value = raw.trim();
  if (value === '' || isUnsafeUrl(value)) return null;
  if (value.startsWith('#')) return { href: value, external: false };

  let url: URL;
  try {
    url = new URL(value, 'https://placeholder.invalid');
  } catch {
    return null;
  }

  // Relative (`/post?id=1`, `page?id=2` is not supported: WP never wrote it).
  if (url.host === 'placeholder.invalid') {
    if (value.startsWith('//')) return { href: value, external: true };
    const legacy = value.startsWith('/') ? legacyIdRoute(url) : null;
    return legacy ? { href: legacy, external: false } : { href: value, external: false };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { href: value, external: true }; // mailto:, tel:
  }

  const hostSite = siteOfHost(url.hostname);
  if (hostSite) {
    const legacy = legacyIdRoute(url);
    const route = legacy ?? (url.pathname === '/' && !url.search ? '/' : null);
    if (route) {
      return hostSite.id === site
        ? { href: route, external: false }
        : { href: `${hostSite.domain}${route}`, external: true };
    }
    return { href: value, external: true };
  }

  if (url.hostname === WP_HOST) {
    const first = url.pathname.split('/')[1];
    const target = SITE_IDS.find((id) => id === first);
    if (target) {
      const resolved = resolveMenuHref({ url: value }, getSite(target));
      if (resolved.href === null) return { href: value, external: true };
      if (resolved.external) return { href: value, external: true };
      return target === site
        ? { href: resolved.href, external: false }
        : { href: `${getSite(target).domain}${resolved.href}`, external: true };
    }
  }

  return { href: value, external: true };
}
