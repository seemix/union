import type { ContentTarget, SiteId } from '@/config/sites';
import { getCategoryById, getPageById } from '@/lib/wp';
import { categoryHref, pageHref, targetHref, type TargetHrefs } from './href';

async function resolve(site: SiteId, target: ContentTarget): Promise<string | null> {
  if (target.kind === 'page') {
    const page = await getPageById(site, target.id);
    return page?.slug ? pageHref(page) : null;
  }
  const category = await getCategoryById(site, target.id);
  return category?.slug ? categoryHref(category) : null;
}

/**
 * Slug routes of the WP entities the config refers to by id (footer, home widgets), so
 * internal links point straight at the canonical URL instead of a 301 from `?id=`.
 *
 * The getters are cached with `page:{site}:{id}` / `category:{site}:{id}`, so a rename in WP
 * (mu-plugin → `/api/revalidate`) refreshes the links too. When WP fails or the entity is
 * gone, the legacy `?id=` href is kept: the proxy still resolves (or 404s) it.
 */
export async function resolveTargetHrefs(
  site: SiteId,
  targets: readonly ContentTarget[],
): Promise<TargetHrefs> {
  const unique = [...new Map(targets.map((t) => [targetHref(t), t])).entries()];
  const entries = await Promise.all(
    unique.map(async ([legacy, target]) => {
      try {
        return [legacy, (await resolve(site, target)) ?? legacy] as const;
      } catch (error) {
        console.error(`[targets:${site}] ${legacy}`, error);
        return [legacy, legacy] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
