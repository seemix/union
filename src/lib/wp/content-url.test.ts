import { describe, expect, it } from 'vitest';
import { isUnsafeUrl, resolveContentHref } from './content-url';

describe('resolveContentHref', () => {
  it('maps legacy relative ?id= links to v2 routes', () => {
    expect(resolveContentHref('/post?id=16303', 'ro')).toEqual({
      href: '/post?id=16303',
      external: false,
    });
    expect(resolveContentHref('/page?id=0893', 'ru')?.href).toBe('/page?id=893');
    expect(resolveContentHref('/category?id=23&page=2', 'ru')?.href).toBe('/category?id=23');
  });

  it('maps baptist.org.md/{site}/… of the current site to internal routes', () => {
    expect(resolveContentHref('https://baptist.org.md/ro/category/stiri/', 'ro')).toEqual({
      href: '/category/stiri',
      external: false,
    });
    expect(resolveContentHref('https://baptist.org.md/ru/?page_id=12', 'ru')?.href).toBe(
      '/page?id=12',
    );
    expect(resolveContentHref('http://baptist.org.md/ru/', 'ru')).toEqual({
      href: '/',
      external: false,
    });
  });

  it('maps site-domain ?id= links; other site gets its own domain', () => {
    expect(resolveContentHref('https://ru.baptist.org.md/post?id=5', 'ru')).toEqual({
      href: '/post?id=5',
      external: false,
    });
    expect(resolveContentHref('https://ro.baptist.org.md/post?id=5', 'ru')).toEqual({
      href: 'https://ro.baptist.org.md/post?id=5',
      external: true,
    });
    expect(resolveContentHref('https://baptist.org.md/ro/category/stiri/', 'ru')).toEqual({
      href: 'https://ro.baptist.org.md/category/stiri',
      external: true,
    });
  });

  it('keeps foreign hosts and unmappable WP URLs external', () => {
    expect(resolveContentHref('https://example.com/a?b=1', 'ru')).toEqual({
      href: 'https://example.com/a?b=1',
      external: true,
    });
    expect(resolveContentHref('https://baptist.org.md/ru/2020/05/some-post/', 'ru')?.external).toBe(
      true,
    );
    expect(resolveContentHref('mailto:a@b.md', 'ru')).toEqual({
      href: 'mailto:a@b.md',
      external: true,
    });
  });

  it('keeps in-page anchors and rejects unsafe or empty hrefs', () => {
    expect(resolveContentHref('#note-1', 'ru')).toEqual({ href: '#note-1', external: false });
    expect(resolveContentHref('', 'ru')).toBeNull();
    expect(resolveContentHref('javascript:alert(1)', 'ru')).toBeNull();
    expect(resolveContentHref(' JaVa\tScRiPt:alert(1)', 'ru')).toBeNull();
    expect(resolveContentHref('data:text/html,<script>alert(1)</script>', 'ru')).toBeNull();
  });
});

describe('isUnsafeUrl', () => {
  it('detects schemes hidden by whitespace and control characters', () => {
    expect(isUnsafeUrl('java\nscript:alert(1)')).toBe(true);
    expect(isUnsafeUrl('vbscript:x')).toBe(true);
    expect(isUnsafeUrl('https://a.b/javascript:')).toBe(false);
    expect(isUnsafeUrl('/post?id=1')).toBe(false);
  });
});
