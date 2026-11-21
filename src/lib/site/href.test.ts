import { describe, expect, it } from 'vitest';
import { postHref, targetHref } from './href';

describe('targetHref', () => {
  it('maps config targets to routes', () => {
    expect(targetHref({ kind: 'page', id: 893 })).toBe('/page?id=893');
    expect(targetHref({ kind: 'category', id: 23 })).toBe('/category?id=23');
  });
});

describe('postHref', () => {
  it('builds /post/{id}-{slug}', () => {
    expect(postHref({ id: 16303, slug: 'some-post' })).toBe('/post/16303-some-post');
    expect(postHref({ id: 5, slug: '%d0%bf' })).toBe('/post/5-%d0%bf');
  });
  it('falls back to the bare id', () => {
    expect(postHref({ id: 7, slug: '' })).toBe('/post/7');
  });
});
