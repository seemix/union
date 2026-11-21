import type { SiteId } from '@/config/sites';

/**
 * Cache tags of WP data (`cacheTag` in ./api.ts). Stage 3/4 revalidation
 * (`revalidateTag`) must build tags with these helpers only.
 *
 * - `site:<s>`            — everything from that WP install
 * - `posts:<s>`           — every post list and search (any post published/changed/deleted)
 * - `post:<s>:<id>`       — one post (also its `not found` answer and id→slug lookup)
 * - `pages:<s>`           — every slug → page lookup (a new page may take a slug)
 * - `page:<s>:<id>`       — one page
 * - `categories:<s>`      — every slug → category lookup
 * - `category:<s>:<id>`   — one category, and post lists filtered by it
 */
export const wpTags = {
  site: (site: SiteId) => `site:${site}`,
  posts: (site: SiteId) => `posts:${site}`,
  post: (site: SiteId, id: number) => `post:${site}:${id}`,
  pages: (site: SiteId) => `pages:${site}`,
  page: (site: SiteId, id: number) => `page:${site}:${id}`,
  categories: (site: SiteId) => `categories:${site}`,
  category: (site: SiteId, id: number) => `category:${site}:${id}`,
} as const;
