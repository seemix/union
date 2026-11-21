/**
 * WP menu item → v2 route. Pure (no I/O, no Next imports), so it is unit-tested.
 *
 * Order of trust:
 * 1. `connectedObject` (Page/Category/Post with slug) — exact, gives `/page/{slug}` etc.
 * 2. The item URL: WP "plain" permalinks (`?page_id=`, `?cat=`, `?p=`) and `/category/{slug}`.
 *    Without a slug we fall back to the old `?id=` routes, which `src/proxy.ts` redirects.
 * 3. Own home (WP home or frontend domain) → `/`.
 * 4. Anything else (other hosts, `mailto:`, `tel:`) → external, unchanged.
 * `#` / empty → no link (a group heading with a submenu).
 */
import type { SiteConfig } from '@/config/sites';

export interface MenuConnectedObject {
  readonly __typename: string;
  readonly databaseId?: number;
  readonly slug?: string;
}

/** The fields of a WPGraphQL `MenuItem` that routing needs. */
export interface RawMenuLink {
  readonly uri?: string | null;
  readonly url?: string | null;
  readonly connectedObject?: MenuConnectedObject | null;
}

export interface MenuHref {
  /** Internal route or absolute external URL; `null` = not a link. */
  readonly href: string | null;
  readonly external: boolean;
}

const NO_LINK: MenuHref = { href: null, external: false };

function internal(href: string): MenuHref {
  return { href, external: false };
}

/** Slugs may arrive decoded (ru) or percent-encoded; emit one canonical encoded form. */
function encodeSlug(slug: string): string {
  let s = slug.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // keep as is
  }
  return encodeURIComponent(s);
}

function positiveInt(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function wpHome(site: SiteConfig): URL {
  const base = new URL(site.wp.restBase);
  return new URL(`${base.origin}${base.pathname.replace(/\/?$/, '/')}`);
}

function fromConnectedObject(obj: MenuConnectedObject | null | undefined): MenuHref | null {
  if (!obj || !obj.slug || !obj.databaseId) return null;
  switch (obj.__typename) {
    case 'Page':
      return internal(`/page/${encodeSlug(obj.slug)}`);
    case 'Category':
      return internal(`/category/${encodeSlug(obj.slug)}`);
    case 'Post':
      return internal(`/post/${obj.databaseId}-${encodeSlug(obj.slug)}`);
    default:
      return null;
  }
}

export function resolveMenuHref(link: RawMenuLink, site: SiteConfig): MenuHref {
  const fromObject = fromConnectedObject(link.connectedObject);
  if (fromObject) return fromObject;

  const raw = (link.url || link.uri || '').trim();
  if (raw === '' || raw.startsWith('#')) return NO_LINK;

  const home = wpHome(site);
  let url: URL;
  try {
    url = new URL(raw, home); // relative `uri` (`/?page_id=11`) resolves against WP home
  } catch {
    return NO_LINK;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { href: raw, external: true };
  }

  const ownHosts = new Set([
    home.host,
    new URL(site.domain).host,
    new URL(site.stagingDomain).host,
  ]);
  if (!ownHosts.has(url.host)) return { href: raw, external: true };

  // Own host: drop the WP install prefix (`/ru`) so the path is site-relative.
  const homePath = home.pathname.replace(/\/$/, '');
  let path = url.pathname;
  if (
    url.host === home.host &&
    homePath &&
    (path === homePath || path.startsWith(`${homePath}/`))
  ) {
    path = path.slice(homePath.length);
  }
  path = path.replace(/\/+$/, '');

  const q = url.searchParams;
  const pageId = positiveInt(q.get('page_id'));
  if (pageId) return internal(`/page?id=${pageId}`);
  const catId = positiveInt(q.get('cat'));
  if (catId) return internal(`/category?id=${catId}`);
  const postId = positiveInt(q.get('p'));
  if (postId) return internal(`/post?id=${postId}`);

  const category = /^\/category\/([^/]+)$/.exec(path);
  if (category) return internal(`/category/${encodeSlug(category[1]!)}`);

  if (path === '' && q.size === 0) return internal('/');
  // Unknown WP URL (dated permalink, attachment…): keep it working as a plain link.
  return { href: url.toString(), external: true };
}
