/**
 * `POST /api/revalidate` — on-demand revalidation from the WP mu-plugin (wp/README.md, P3.1):
 *
 *   X-Union-Secret: <UNION_REVALIDATE_SECRET of that WP = REVALIDATE_SECRET_<SITE> here>
 *   {"site":"ru","type":"post|page|category|menu","id":123,"slug":"…","action":"publish|update|unpublish|delete"}
 *
 * WP sends it with `blocking: false` and never reads the answer, so every problem is logged here.
 */
import { isSiteId, type SiteId } from '@/config/sites';
import { safeEqual } from '@/lib/security/safe-equal';
import { SITE_HEADER } from '@/lib/site/header';
import { wpTags } from '@/lib/wp/tags';

export const REVALIDATE_TYPES = ['post', 'page', 'category', 'menu'] as const;
export const REVALIDATE_ACTIONS = ['publish', 'update', 'unpublish', 'delete'] as const;
export type RevalidateType = (typeof REVALIDATE_TYPES)[number];
export type RevalidateAction = (typeof REVALIDATE_ACTIONS)[number];

export interface RevalidateEvent {
  readonly site: SiteId;
  readonly type: RevalidateType;
  readonly id: number;
  readonly slug: string;
  readonly action: RevalidateAction;
}

/** Bodies from WP are tiny; anything bigger is not ours. */
const MAX_BODY_BYTES = 4096;

export function revalidateSecretEnv(site: SiteId): string {
  return `REVALIDATE_SECRET_${site.toUpperCase()}`;
}

const includes = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v);

export function parseEvent(value: unknown): RevalidateEvent | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!isSiteId(v.site) || !includes(REVALIDATE_TYPES, v.type)) return null;
  if (!includes(REVALIDATE_ACTIONS, v.action)) return null;
  if (typeof v.id !== 'number' || !Number.isSafeInteger(v.id) || v.id <= 0) return null;
  const slug = typeof v.slug === 'string' ? v.slug : '';
  return { site: v.site, type: v.type, id: v.id, slug, action: v.action };
}

/**
 * Tags to invalidate (names from `src/lib/wp/tags.ts`).
 * - post: the post itself and every list/search/home slider (`posts:`),
 *   which also covers category-filtered lists, whatever categories it moved between.
 * - page: the page and every slug lookup (a new/renamed page may take a slug), and the menu,
 *   whose items link to pages by slug (a rename would otherwise leave a 404 link there).
 * - category: the category, slug lookups, post lists (embedded term names, filters) and the
 *   menu (same reason as pages).
 * - menu: the site menu (there is one menu per site; the WP menu id is not needed).
 */
export function tagsFor({ site, type, id }: RevalidateEvent): string[] {
  switch (type) {
    case 'post':
      return [wpTags.post(site, id), wpTags.posts(site)];
    case 'page':
      return [wpTags.page(site, id), wpTags.pages(site), wpTags.menu(site)];
    case 'category':
      return [
        wpTags.category(site, id),
        wpTags.categories(site),
        wpTags.posts(site),
        wpTags.menu(site),
      ];
    case 'menu':
      return [wpTags.menu(site)];
  }
}

/**
 * `max` = stale-while-revalidate: fine for new or edited content.
 * Removed content must not be served even once more → expire immediately.
 */
export function profileFor(action: RevalidateAction): 'max' | { expire: number } {
  return action === 'unpublish' || action === 'delete' ? { expire: 0 } : 'max';
}

export interface RevalidateHandlerOptions {
  readonly revalidateTag: (tag: string, profile: 'max' | { expire: number }) => void;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export function createRevalidateHandler({
  revalidateTag,
  env = process.env,
}: RevalidateHandlerOptions) {
  return async function POST(request: Request): Promise<Response> {
    const site = request.headers.get(SITE_HEADER);
    if (!site || !isSiteId(site)) return json(404, { error: 'not_found' });

    // Secret of the site this host serves: a ru secret can never revalidate ro.
    const secret = env[revalidateSecretEnv(site)]?.trim();
    if (!secret) {
      console.error(`[revalidate] ${revalidateSecretEnv(site)} is not set: request rejected`);
    }
    if (!safeEqual(request.headers.get('x-union-secret'), secret)) {
      return json(401, { error: 'unauthorized' });
    }

    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json(413, { error: 'too_large' });
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      raw = null;
    }
    const event = parseEvent(raw);
    if (!event) {
      console.error(`[revalidate] ${site}: invalid payload ${text.slice(0, 300)}`);
      return json(400, { error: 'invalid_payload' });
    }
    if (event.site !== site) {
      // UNION_SITE in wp-config.php does not match the frontend URL it posts to.
      console.error(`[revalidate] payload site "${event.site}" sent to the ${site} frontend`);
      return json(400, { error: 'site_mismatch' });
    }

    const tags = tagsFor(event);
    const profile = profileFor(event.action);
    for (const tag of tags) revalidateTag(tag, profile);
    console.info(
      `[revalidate] ${site} ${event.type}:${event.id} ${event.action} → ${tags.join(', ')}`,
    );
    return json(200, { revalidated: true, tags });
  };
}
