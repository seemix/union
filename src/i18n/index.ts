import type { SiteId } from '@/config/sites';
import type { Dictionary } from './ru';

export type { Dictionary } from './ru';
export { formatDate, formatNumber } from './format';

// Lazy per-site import (Next i18n guide pattern): only the requested locale is
// loaded, and dictionaries never end up in a client bundle unless a Client
// Component imports `./ru`/`./ro` directly — pass the strings it needs as props.
const dictionaries: Readonly<Record<SiteId, () => Promise<Dictionary>>> = {
  ru: () => import('./ru').then((m) => m.ru),
  ro: () => import('./ro').then((m) => m.ro),
};

/** UI strings for a site. Server-side: call in Server Components / route handlers. */
export function getDictionary(site: SiteId): Promise<Dictionary> {
  return dictionaries[site]();
}
