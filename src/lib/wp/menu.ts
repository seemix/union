/**
 * Site menu from WPGraphQL (Q11). The only GraphQL use; everything else is REST.
 *
 * Cached with tags `menu:{site}` + `site:{site}`, same outcome-based lifetimes as ./api.ts.
 * Returns the item tree (any depth) with URLs already converted to v2 routes.
 */
import { cacheLife, cacheTag } from 'next/cache';
import { getSite, type SiteId } from '@/config/sites';
import { WP_TIMEOUT_MS, WpError, type WpErrorInfo } from './client';
import { resolveMenuHref, type MenuConnectedObject } from './menu-url';
import { wpTags } from './tags';

export interface MenuItem {
  /** WP `databaseId`; stable React key. */
  readonly id: number;
  readonly label: string;
  /** Internal route or external URL; `null` = group heading, only expands its children. */
  readonly href: string | null;
  readonly external: boolean;
  readonly children: readonly MenuItem[];
}

/** WPGraphQL caps `first` at 100. */
const MENU_QUERY = `query Menu($id: ID!) {
  menu(id: $id, idType: DATABASE_ID) {
    menuItems(first: 100) {
      nodes {
        databaseId
        parentDatabaseId
        label
        uri
        url
        connectedObject {
          __typename
          ... on Page { databaseId slug }
          ... on Category { databaseId slug }
          ... on Post { databaseId slug }
        }
      }
    }
  }
}`;

export interface RawMenuNode {
  readonly databaseId: number;
  readonly parentDatabaseId: number | null;
  readonly label: string | null;
  readonly uri: string | null;
  readonly url: string | null;
  readonly connectedObject: MenuConnectedObject | null;
}

interface MenuResponse {
  readonly data?: {
    readonly menu: { readonly menuItems: { readonly nodes: readonly RawMenuNode[] } } | null;
  };
  readonly errors?: readonly { readonly message: string }[];
}

type MenuResult =
  | { readonly status: 'ok'; readonly items: readonly MenuItem[] }
  | { readonly status: 'not_found' }
  | { readonly status: 'error'; readonly error: WpErrorInfo };

type MutableItem = { -readonly [K in keyof MenuItem]: MenuItem[K] } & { children: MenuItem[] };

/** Flat WP nodes (menu order) → tree. A node whose parent is missing becomes a root. */
export function buildMenuTree(site: SiteId, nodes: readonly RawMenuNode[]): MenuItem[] {
  const config = getSite(site);
  const byId = new Map<number, { item: MutableItem; parent: number }>();
  for (const n of nodes) {
    const { href, external } = resolveMenuHref(n, config);
    byId.set(n.databaseId, {
      item: { id: n.databaseId, label: (n.label ?? '').trim(), href, external, children: [] },
      parent: n.parentDatabaseId ?? 0,
    });
  }
  const roots: MenuItem[] = [];
  for (const { item, parent } of byId.values()) {
    const parentEntry = parent !== item.id ? byId.get(parent) : undefined;
    (parentEntry ? parentEntry.item.children : roots).push(item);
  }
  return roots;
}

async function requestMenu(site: SiteId): Promise<MenuResult> {
  const { wp } = getSite(site);
  const fail = (error: Omit<WpErrorInfo, 'url'>): MenuResult => ({
    status: 'error',
    error: { ...error, url: wp.graphqlEndpoint },
  });
  try {
    const response = await fetch(wp.graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: MENU_QUERY, variables: { id: String(wp.menuId) } }),
      signal: AbortSignal.timeout(WP_TIMEOUT_MS),
    });
    if (!response.ok) {
      return fail({
        kind: 'http',
        status: response.status,
        message: `WPGraphQL responded ${response.status}`,
      });
    }
    const body = (await response.json()) as MenuResponse;
    if (body.errors?.length) {
      return fail({ kind: 'http', message: `WPGraphQL: ${body.errors[0]!.message}` });
    }
    const menu = body.data?.menu;
    if (!menu) return { status: 'not_found' };
    return { status: 'ok', items: buildMenuTree(site, menu.menuItems.nodes) };
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    return fail({
      kind: timedOut ? 'timeout' : err instanceof SyntaxError ? 'parse' : 'network',
      message: `WPGraphQL request failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

async function cachedMenu(site: SiteId): Promise<MenuResult> {
  'use cache';
  cacheTag(wpTags.site(site), wpTags.menu(site));
  const r = await requestMenu(site);
  if (r.status === 'ok') cacheLife('hours');
  else if (r.status === 'not_found') cacheLife('minutes');
  else cacheLife('seconds');
  return r;
}

/**
 * Menu tree of the site. `[]` when WP has no such menu (nothing to render);
 * throws `WpError` when WPGraphQL is unavailable.
 */
export async function getMenu(site: SiteId): Promise<readonly MenuItem[]> {
  const r = await cachedMenu(site);
  if (r.status === 'ok') return r.items;
  if (r.status === 'not_found') return [];
  throw new WpError(r.error);
}
