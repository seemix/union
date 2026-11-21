import { describe, expect, it } from 'vitest';
import { getSite } from '@/config/sites';
import { resolveMenuHref } from './menu-url';

const ru = getSite('ru');
const ro = getSite('ro');

describe('resolveMenuHref', () => {
  it('uses connectedObject for pages, categories and posts', () => {
    expect(
      resolveMenuHref(
        {
          uri: '/?page_id=11',
          connectedObject: { __typename: 'Page', databaseId: 11, slug: 'история' },
        },
        ru,
      ),
    ).toEqual({ href: `/page/${encodeURIComponent('история')}`, external: false });
    expect(
      resolveMenuHref(
        { connectedObject: { __typename: 'Category', databaseId: 5, slug: 'stiri' } },
        ro,
      ).href,
    ).toBe('/category/stiri');
    expect(
      resolveMenuHref(
        { connectedObject: { __typename: 'Post', databaseId: 42, slug: 'hello' } },
        ro,
      ).href,
    ).toBe('/post/42-hello');
  });

  it('does not double-encode already encoded slugs', () => {
    const encoded = encodeURIComponent('история');
    expect(
      resolveMenuHref({ connectedObject: { __typename: 'Page', databaseId: 1, slug: encoded } }, ru)
        .href,
    ).toBe(`/page/${encoded}`);
  });

  it('falls back to ?id= routes for plain permalinks without connectedObject', () => {
    expect(
      resolveMenuHref({ uri: '/?page_id=12', url: 'https://baptist.org.md/ru/?page_id=12' }, ru)
        .href,
    ).toBe('/page?id=12');
    expect(resolveMenuHref({ uri: '/?cat=17' }, ru).href).toBe('/category?id=17');
    expect(resolveMenuHref({ uri: '/?p=99' }, ru).href).toBe('/post?id=99');
  });

  it('maps pretty category URLs', () => {
    expect(
      resolveMenuHref({ url: 'https://baptist.org.md/ro/category/stiri-interne/' }, ro).href,
    ).toBe('/category/stiri-interne');
  });

  it('maps own home (WP home or frontend domain) to /', () => {
    expect(
      resolveMenuHref({ uri: 'http://baptist.org.md/ru', url: 'http://baptist.org.md/ru' }, ru),
    ).toEqual({ href: '/', external: false });
    expect(resolveMenuHref({ url: 'https://ru.baptist.org.md/' }, ru).href).toBe('/');
    expect(resolveMenuHref({ url: 'https://baptist.org.md/ru/' }, ru).href).toBe('/');
  });

  it('keeps external links as is (other site, other hosts, mailto)', () => {
    expect(resolveMenuHref({ url: 'http://ro.baptist.org.md' }, ru)).toEqual({
      href: 'http://ro.baptist.org.md',
      external: true,
    });
    expect(resolveMenuHref({ url: 'https://example.com/a?b=1' }, ru)).toEqual({
      href: 'https://example.com/a?b=1',
      external: true,
    });
    expect(resolveMenuHref({ url: 'mailto:a@b.md' }, ru)).toEqual({
      href: 'mailto:a@b.md',
      external: true,
    });
  });

  it('returns no link for "#" and empty values', () => {
    expect(resolveMenuHref({ uri: '#', url: '#' }, ru)).toEqual({ href: null, external: false });
    expect(resolveMenuHref({ uri: '', url: null }, ru)).toEqual({ href: null, external: false });
  });

  it('keeps unknown WP URLs working as external links', () => {
    expect(
      resolveMenuHref({ url: 'https://baptist.org.md/ru/2024/05/01/some-post/' }, ru).external,
    ).toBe(true);
  });
});
