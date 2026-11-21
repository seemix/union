import { cacheLife } from 'next/cache';

export type CacheOutcome = 'ok' | 'not_found' | 'error';

/**
 * The one `cacheLife` call of a `use cache` WP getter, chosen by outcome:
 * ok → `okProfile` (`hours` for entities, `minutes` for lists) · not found → `minutes` ·
 * error → `seconds`, so a WP outage is never cached for long.
 */
export function cacheLifeFor(outcome: CacheOutcome, okProfile: 'hours' | 'minutes'): void {
  // `cacheLife` is overloaded per profile name, so each call takes a literal.
  if (outcome === 'error') cacheLife('seconds');
  else if (outcome === 'ok' && okProfile === 'hours') cacheLife('hours');
  else cacheLife('minutes');
}
