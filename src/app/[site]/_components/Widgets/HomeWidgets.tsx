import { cacheLife } from 'next/cache';
import { getSite, widgetTarget, type ContentTarget, type SiteId } from '@/config/sites';
import { resolveTargetHrefs } from '@/lib/site/targets';
import { Widgets } from './Widgets';

/**
 * Widgets for "today". `new Date()` is only allowed inside `use cache`; a short
 * lifetime keeps the Bible reading from lagging far behind midnight.
 */
export async function HomeWidgets({ site }: { site: SiteId }) {
  'use cache';
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  const { widgets } = getSite(site);
  const hrefs = await resolveTargetHrefs(
    site,
    widgets.map(widgetTarget).filter((t): t is ContentTarget => t !== null),
  );
  return <Widgets site={site} widgets={widgets} today={new Date()} hrefs={hrefs} />;
}
