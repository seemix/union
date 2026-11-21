/** Longest search query we accept (also the `maxLength` of the header form). */
export const MAX_QUERY_LENGTH = 200;

/**
 * Cleans the raw `?q=` value: first value if repeated, trimmed, whitespace collapsed,
 * cut to `MAX_QUERY_LENGTH`. Empty string = no query.
 */
export function normalizeQuery(raw: string | readonly string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH).trim();
}

/** Escapes every regex metacharacter, so user input is only ever matched literally. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface TextPart {
  readonly text: string;
  readonly match: boolean;
}

/**
 * Splits PLAIN text into matched / unmatched parts for the words of `query`
 * (case-insensitive, Unicode-aware). It returns data, not markup: the caller renders
 * the parts as React text nodes (`<mark>` for matches), so nothing is ever parsed as
 * HTML and no `dangerouslySetInnerHTML` is needed. Concatenating the parts gives `text`.
 */
export function splitByQuery(text: string, query: string): TextPart[] {
  const words = [...new Set(normalizeQuery(query).split(' ').filter(Boolean))];
  if (!text || words.length === 0) return text ? [{ text, match: false }] : [];

  // Longest first, so `mamă` wins over `ma` at the same position.
  words.sort((a, b) => b.length - a.length);
  const re = new RegExp(words.map(escapeRegExp).join('|'), 'giu');

  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const start = m.index;
    if (start > last) parts.push({ text: text.slice(last, start), match: false });
    parts.push({ text: m[0], match: true });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false });
  return parts;
}
