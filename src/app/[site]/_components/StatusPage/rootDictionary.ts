import { site } from 'next/root-params';
import { isSiteId } from '@/config/sites';
import { getDictionary, type Dictionary } from '@/i18n';

/**
 * Dictionary of the current site for `not-found.tsx` / `loading.tsx`, which get no `params`:
 * `site` is a root param, so reading it keeps them static. Falls back to ru, like
 * `useSiteDictionary` (the layout already 404s unknown sites).
 */
export async function rootDictionary(): Promise<Dictionary> {
  const id = await site();
  return getDictionary(isSiteId(id) ? id : 'ru');
}
