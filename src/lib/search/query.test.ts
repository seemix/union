import { describe, expect, it } from 'vitest';
import { searchHref } from '@/lib/site/href';
import { MAX_QUERY_LENGTH, escapeRegExp, normalizeQuery, splitByQuery } from './query';

const joined = (text: string, q: string) =>
  splitByQuery(text, q)
    .map((p) => p.text)
    .join('');
const matches = (text: string, q: string) =>
  splitByQuery(text, q)
    .filter((p) => p.match)
    .map((p) => p.text);

describe('normalizeQuery', () => {
  it('handles missing, empty and blank values', () => {
    expect(normalizeQuery(undefined)).toBe('');
    expect(normalizeQuery('')).toBe('');
    expect(normalizeQuery('   \n\t ')).toBe('');
  });
  it('takes the first of repeated values, trims and collapses spaces', () => {
    expect(normalizeQuery(['  a   b ', 'c'])).toBe('a b');
  });
  it('cuts overly long queries', () => {
    expect(normalizeQuery('x'.repeat(5000))).toHaveLength(MAX_QUERY_LENGTH);
  });
});

describe('splitByQuery', () => {
  it.each(['(', '[', '.*', '<script>', '"', '\\', '+', '?', '$', '|', '{', '^', 'a(b'])(
    'treats %j literally without throwing',
    (q) => {
      const text = `x ${q} y ${q}`;
      expect(() => splitByQuery(text, q)).not.toThrow();
      expect(joined(text, q)).toBe(text);
      expect(matches(text, q).every((m) => m.toLowerCase() === q.toLowerCase())).toBe(true);
    },
  );

  it('".*" does not behave as a wildcard', () => {
    expect(matches('abc .* def', '.*')).toEqual(['.*']);
  });

  it('keeps markup as plain text: parts never contain more than the input', () => {
    const text = 'a <script>alert(1)</script> b';
    expect(joined(text, '<script>')).toBe(text);
    expect(matches(text, '<script>')).toEqual(['<script>']);
  });

  it('matches case-insensitively, also Cyrillic and Romanian diacritics', () => {
    expect(matches('Вера и ВЕРА', 'вера')).toEqual(['Вера', 'ВЕРА']);
    expect(matches('Ştiri și știri', 'știri')).toEqual(['știri']);
  });

  it('highlights every word of the query, longest alternative first', () => {
    expect(matches('mamă și ma', 'ma mamă')).toEqual(['mamă', 'ma']);
  });

  it('returns the text unchanged for an empty query or text', () => {
    expect(splitByQuery('abc', '')).toEqual([{ text: 'abc', match: false }]);
    expect(splitByQuery('', 'a')).toEqual([]);
  });
});

describe('escapeRegExp', () => {
  it('escapes metacharacters', () => {
    expect(new RegExp(escapeRegExp('(a)[b].*')).test('(a)[b].*')).toBe(true);
  });
});

describe('searchHref', () => {
  it('encodes the query everywhere', () => {
    expect(searchHref('a b&c="<x>"')).toBe('/search?q=a%20b%26c%3D%22%3Cx%3E%22');
    expect(searchHref('вера', 3)).toBe(`/search?q=${encodeURIComponent('вера')}&page=3`);
  });
  it('omits page 1 and an empty query', () => {
    expect(searchHref('a', 1)).toBe('/search?q=a');
    expect(searchHref('')).toBe('/search');
  });
});
