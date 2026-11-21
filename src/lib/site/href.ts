import type { ContentTarget } from '@/config/sites';

/**
 * Route of a config-referenced WP entity. Uses the legacy `?id=` form (slugs are not
 * in the config); `src/proxy.ts` 301-redirects it to the slug route (stage 5).
 */
export function targetHref(target: ContentTarget): string {
  return `/${target.kind}?id=${target.id}`;
}

/**
 * Canonical post route `/post/{id}-{slug}` (Q3). The slug is used as WP stores it
 * (ru: percent-encoded Cyrillic, Q4); an empty slug falls back to `/post/{id}`.
 */
export function postHref(post: { readonly id: number; readonly slug: string }): string {
  return post.slug ? `/post/${post.id}-${post.slug}` : `/post/${post.id}`;
}
