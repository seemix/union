import { describe, expect, it } from 'vitest';
import {
  categoryHref,
  pageHref,
  parseListPage,
  parsePostIdSlug,
  postHref,
  slugForUrl,
  targetHref,
} from './href';

const RU_WP = '%d0%bf%d1%80%d0%b0%d0%b7%d0%b4%d0%bd%d0%b8%d0%ba-40'; // «праздник-40» as WP stores it
const RU_ENC = '%D0%BF%D1%80%D0%B0%D0%B7%D0%B4%D0%BD%D0%B8%D0%BA-40';

describe('targetHref', () => {
  it('maps config targets to routes', () => {
    expect(targetHref({ kind: 'page', id: 893 })).toBe('/page?id=893');
    expect(targetHref({ kind: 'category', id: 23 })).toBe('/category?id=23');
  });
});

describe('slugForUrl', () => {
  it('emits one encoded spelling', () => {
    expect(slugForUrl(RU_WP).slug).toBe(RU_ENC);
    expect(slugForUrl('праздник-40').slug).toBe(RU_ENC);
    expect(slugForUrl('some-post').slug).toBe('some-post');
    expect(slugForUrl('').slug).toBe('');
  });

  it('compares URL ↔ WP after decoding both sides', () => {
    expect(slugForUrl(RU_WP, 'праздник-40').matches).toBe(true);
    expect(slugForUrl(RU_WP, RU_ENC).matches).toBe(true);
    expect(slugForUrl(RU_WP, RU_WP).matches).toBe(true);
    expect(slugForUrl('some-post', 'some-post').matches).toBe(true);
  });

  it('detects a different or missing slug', () => {
    expect(slugForUrl('some-post', 'old-post').matches).toBe(false);
    expect(slugForUrl('some-post', 'Some-Post').matches).toBe(false);
    expect(slugForUrl('some-post', '').matches).toBe(false);
    expect(slugForUrl('some-post').matches).toBe(false);
  });

  it('survives malformed escapes', () => {
    expect(slugForUrl('some-post', '%zz').matches).toBe(false);
    expect(slugForUrl('100%').slug).toBe('100%25');
  });
});

describe('postHref', () => {
  it('builds /post/{id}-{slug}', () => {
    expect(postHref({ id: 16303, slug: 'some-post' })).toBe('/post/16303-some-post');
    expect(postHref({ id: 5, slug: '%d0%bf' })).toBe('/post/5-%D0%BF');
  });
  it('falls back to the bare id', () => {
    expect(postHref({ id: 7, slug: '' })).toBe('/post/7');
  });
});

describe('categoryHref', () => {
  it('builds /category/{slug}', () => {
    expect(categoryHref({ slug: 'stiri' })).toBe('/category/stiri');
    expect(categoryHref({ slug: '%d0%bf' })).toBe('/category/%D0%BF');
  });
  it('adds the page number only after the first page', () => {
    expect(categoryHref({ slug: 'stiri' }, 1)).toBe('/category/stiri');
    expect(categoryHref({ slug: 'stiri' }, 2)).toBe('/category/stiri/2');
  });
});

describe('pageHref', () => {
  it('builds /page/{slug}', () => {
    expect(pageHref({ slug: 'despre' })).toBe('/page/despre');
    expect(pageHref({ slug: '%d0%bf' })).toBe('/page/%D0%BF');
  });
});

describe('parseListPage', () => {
  it('no segment is the canonical first page', () => {
    expect(parseListPage(undefined)).toEqual({ page: 1, canonical: true });
    expect(parseListPage([])).toEqual({ page: 1, canonical: true });
  });
  it('parses a page number', () => {
    expect(parseListPage(['2'])).toEqual({ page: 2, canonical: true });
    expect(parseListPage(['120'])).toEqual({ page: 120, canonical: true });
  });
  it('flags /1 and zero-padded numbers for a redirect', () => {
    expect(parseListPage(['1'])).toEqual({ page: 1, canonical: false });
    expect(parseListPage(['02'])).toEqual({ page: 2, canonical: false });
  });
  it('rejects everything else', () => {
    for (const bad of [['0'], ['-1'], ['abc'], ['2x'], ['1.5'], [''], ['9999999999'], ['2', '3']]) {
      expect(parseListPage(bad)).toBeNull();
    }
  });
});

describe('parsePostIdSlug', () => {
  it('parses id and slug', () => {
    expect(parsePostIdSlug('113186-slug-with-dashes')).toEqual({
      id: 113186,
      rawId: '113186',
      slug: 'slug-with-dashes',
    });
    expect(parsePostIdSlug('113186')).toEqual({ id: 113186, rawId: '113186', slug: null });
    expect(parsePostIdSlug('113186-')).toEqual({ id: 113186, rawId: '113186', slug: '' });
    expect(parsePostIdSlug('007-x')).toEqual({ id: 7, rawId: '007', slug: 'x' });
  });
  it('rejects ids that are missing, zero or too long', () => {
    for (const bad of ['', 'slug', '-1-x', '0', '0-x', '12abc', ' 12', '1234567890123456']) {
      expect(parsePostIdSlug(bad)).toBeNull();
    }
  });
});
