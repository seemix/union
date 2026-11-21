import { getSite, type SiteId } from '@/config/sites';

/** Where both WP installs and their readers are. */
const SITE_TIME_ZONE = 'Europe/Chisinau';

// WP REST `date` is site-local wall time without an offset: "2024-05-01T10:30:00".
const WP_LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/;

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

function dateFormatter(lang: string, timeZone: string): Intl.DateTimeFormat {
  const key = `${lang}|${timeZone}`;
  let f = dateFormatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(lang, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone,
    });
    dateFormatters.set(key, f);
  }
  return f;
}

/**
 * Post date in the site's language: `DD.MM.YYYY` for both ru and ro (as legacy).
 * Offset-less WP strings keep their calendar day as is (no server-TZ shift);
 * `Date` objects and ISO strings with an offset/`Z` are shown in Chisinau time.
 * Invalid input → empty string.
 */
export function formatDate(value: string | Date, site: SiteId): string {
  const { lang } = getSite(site);

  if (typeof value === 'string') {
    const m = WP_LOCAL_DATE.exec(value.trim());
    if (m) {
      const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
      return Number.isNaN(date.getTime()) ? '' : dateFormatter(lang, 'UTC').format(date);
    }
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '' : dateFormatter(lang, SITE_TIME_ZONE).format(date);
}

/** Integer/decimal in the site's language (e.g. view counts): ru `12 345`, ro `12.345`. */
export function formatNumber(value: number, site: SiteId): string {
  const { lang } = getSite(site);
  let f = numberFormatters.get(lang);
  if (!f) {
    f = new Intl.NumberFormat(lang);
    numberFormatters.set(lang, f);
  }
  return f.format(value);
}
