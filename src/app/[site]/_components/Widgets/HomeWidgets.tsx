import { cacheLife } from 'next/cache';
import { getSite, type SiteId } from '@/config/sites';
import { Widgets } from './Widgets';

/**
 * Widgets for "today". `new Date()` is only allowed inside `use cache`; a short
 * lifetime keeps the Bible reading from lagging far behind midnight.
 */
export async function HomeWidgets({ site }: { site: SiteId }) {
  'use cache';
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  return <Widgets site={site} widgets={getSite(site).widgets} today={new Date()} />;
}
