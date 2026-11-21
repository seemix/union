import type { WpMedia, WpPostSummary } from './types';

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  laquo: '«',
  raquo: '»',
  bdquo: '„',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
};

/** Decodes the entities WP emits in `rendered` strings (numeric, hex and the common named ones). */
export function decodeEntities(text: string): string {
  return text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (match, dec, hex, name) => {
    if (name) return NAMED_ENTITIES[String(name).toLowerCase()] ?? match;
    const code = dec ? Number(dec) : parseInt(hex, 16);
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code)
      : match;
  });
}

/** Plain text of a rendered WP fragment (tags removed, entities decoded, spaces collapsed). */
export function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Card excerpt, same shape as the legacy site: first two sentences, cut to `words` words,
 * with a trailing `...`. `words <= 0` → empty string (no excerpt).
 */
export function excerptOf(html: string, words: number): string {
  if (words <= 0) return '';
  const text = plainText(html)
    .split(/[.!?]/)
    .slice(0, 2)
    .join('. ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, words)
    .join(' ');
  return text ? `${text}...` : '';
}

export interface PostImage {
  readonly src: string;
  readonly alt: string;
}

/** Featured image of a summary fetched with `_embed=wp:featuredmedia`; `null` when absent/deleted. */
export function featuredImage(post: Pick<WpPostSummary, '_embedded'>): PostImage | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media || !('source_url' in media)) return null;
  const m: WpMedia = media;
  const src = m.media_details.sizes?.large?.source_url ?? m.source_url;
  return src ? { src, alt: m.alt_text } : null;
}
