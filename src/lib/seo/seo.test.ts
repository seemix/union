import { describe, expect, it } from 'vitest';
import { getSite, isProductionHost } from '@/config/sites';
import { breadcrumbLd, homeLd, isoFromGmt, newsArticleLd, serializeJsonLd } from './json-ld';
import { buildMetadata, homeLanguages } from './metadata';
import { postEntries, sitemapUrl, staticEntries } from './sitemap';

const ru = getSite('ru');
const ro = getSite('ro');

describe('isProductionHost', () => {
  it('accepts only the production domains', () => {
    expect(isProductionHost('ru.baptist.org.md')).toBe(true);
    expect(isProductionHost('RO.baptist.org.md:443')).toBe(true);
    expect(isProductionHost('next.ru.baptist.org.md')).toBe(false);
    expect(isProductionHost('ru.localhost:3000')).toBe(false);
    expect(isProductionHost('localhost:3000')).toBe(false);
    expect(isProductionHost(null)).toBe(false);
  });
});

describe('buildMetadata', () => {
  it('has canonical, OG, Twitter and the default image', () => {
    const m = buildMetadata({ site: ru, title: 'Заголовок', path: '/page/x' });
    expect(m.alternates?.canonical).toBe('https://ru.baptist.org.md/page/x');
    expect(m.openGraph?.images).toEqual([
      expect.objectContaining({ url: 'https://ru.baptist.org.md/og/ru.png', width: 1200 }),
    ]);
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(m.description).toBe(ru.siteTitle);
  });

  it('uses the post image and falls back to the title as alt', () => {
    const m = buildMetadata({
      site: ro,
      title: 'T',
      path: '/post/1-a',
      type: 'article',
      image: { url: 'https://baptist.org.md/a.jpg', alt: '' },
    });
    expect(m.openGraph?.images).toEqual([{ url: 'https://baptist.org.md/a.jpg', alt: 'T' }]);
  });

  it('home hreflang links both sites, and only the home passes languages', () => {
    expect(homeLanguages()).toEqual({
      ru: 'https://ru.baptist.org.md/',
      ro: 'https://ro.baptist.org.md/',
    });
    expect(
      buildMetadata({ site: ru, title: 'x', path: '/post/1' }).alternates?.languages,
    ).toBeUndefined();
  });
});

describe('JSON-LD', () => {
  it('home: Organization + WebSite with SearchAction', () => {
    const graph = (homeLd(ru)['@graph'] as Record<string, unknown>[]) ?? [];
    expect(graph.map((n) => n['@type'])).toEqual(['Organization', 'WebSite']);
    const search = graph[1]!.potentialAction as Record<string, unknown>;
    expect(search['@type']).toBe('SearchAction');
    expect((search.target as { urlTemplate: string }).urlTemplate).toBe(
      'https://ru.baptist.org.md/search?q={search_term_string}',
    );
    expect(search['query-input']).toBe('required name=search_term_string');
    expect(graph[0]!.url).toMatch(/^https:\/\//);
  });

  it('NewsArticle has the fields Google requires', () => {
    const ld = newsArticleLd({
      site: ru,
      title: 'x'.repeat(200),
      description: 'd',
      url: 'https://ru.baptist.org.md/post/1-a',
      image: 'https://baptist.org.md/a.jpg',
      publishedGmt: '2026-11-19T08:13:34',
      modifiedGmt: '2026-11-20T08:13:34',
      section: 'Новости',
    });
    expect(ld['@type']).toBe('NewsArticle');
    expect((ld.headline as string).length).toBeLessThanOrEqual(110);
    expect(ld.datePublished).toBe('2026-11-19T08:13:34.000Z');
    expect(ld.dateModified).toBe('2026-11-20T08:13:34.000Z');
    for (const key of ['image', 'author', 'publisher', 'mainEntityOfPage'])
      expect(ld).toHaveProperty(key);
  });

  it('BreadcrumbList positions start at 1', () => {
    const ld = breadcrumbLd([
      { name: 'A', url: 'https://x/' },
      { name: 'B', url: 'https://x/b' },
    ]);
    expect((ld.itemListElement as { position: number }[]).map((i) => i.position)).toEqual([1, 2]);
  });

  it('isoFromGmt ignores WP zero dates', () => {
    expect(isoFromGmt('0000-00-00T00:00:00')).toBeUndefined();
    expect(isoFromGmt('')).toBeUndefined();
  });

  it('serialization cannot close the script tag', () => {
    const json = serializeJsonLd({ t: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual({ t: '</script><script>alert(1)</script>' });
  });
});

describe('sitemap entries', () => {
  it('lists canonical absolute URLs, de-duplicated, without empty slugs', () => {
    const entries = staticEntries(
      ru,
      [
        { id: 1, slug: '%d0%bd%d0%be%d0%b2%d0%be%d1%81%d1%82%d0%b8' },
        { id: 2, slug: '' },
      ],
      [
        { id: 3, slug: 'about', modified_gmt: '2024-01-02T03:04:05' },
        { id: 4, slug: 'about', modified_gmt: '2024-01-02T03:04:05' },
      ],
    );
    expect(entries.map((e) => e.url)).toEqual([
      'https://ru.baptist.org.md/',
      'https://ru.baptist.org.md/category/%D0%BD%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D0%B8',
      'https://ru.baptist.org.md/page/about',
    ]);
  });

  it('posts use /post/{id}-{slug}; a bad modified date is dropped', () => {
    const [e] = postEntries(ro, [{ id: 7, slug: 'a-b', modified_gmt: '0000-00-00T00:00:00' }]);
    expect(e).toEqual({ url: 'https://ro.baptist.org.md/post/7-a-b', lastModified: undefined });
    expect(sitemapUrl(ro, 2)).toBe('https://ro.baptist.org.md/sitemap/2.xml');
  });
});

describe('robots.txt', () => {
  it('staging and localhost are closed, with no sitemap', async () => {
    const { robotsTxt } = await import('./robots');
    expect(robotsTxt(ru, 'next.ru.baptist.org.md')).toBe('User-Agent: *\nDisallow: /\n');
    expect(robotsTxt(ru, 'ru.localhost:3000')).toBe('User-Agent: *\nDisallow: /\n');
  });

  it('production lists only the own sitemap index (no WP call needed)', async () => {
    const { robotsTxt } = await import('./robots');
    const txt = robotsTxt(ro, 'ro.baptist.org.md');
    expect(txt).toContain('Allow: /');
    expect(txt).toContain('Sitemap: https://ro.baptist.org.md/sitemap_index.xml');
    expect(txt.match(/^Sitemap:/gm)).toHaveLength(1);
    expect(txt).not.toContain('ru.baptist');
  });
});

describe('sitemap XML', () => {
  it('escapes URLs and writes ISO lastmod', async () => {
    const { urlsetXml, sitemapIndexXml, parseSitemapFile } = await import('./sitemap');
    const xml = urlsetXml([
      { url: 'https://x/a?b=1&c=<2>', lastModified: new Date('2024-01-02T03:04:05Z') },
    ]);
    expect(xml).toContain('<loc>https://x/a?b=1&amp;c=&lt;2&gt;</loc>');
    expect(xml).toContain('<lastmod>2024-01-02T03:04:05.000Z</lastmod>');
    expect(sitemapIndexXml(ru, 2)).toContain('<loc>https://ru.baptist.org.md/sitemap/1.xml</loc>');
    expect(parseSitemapFile('0.xml')).toBe(0);
    expect(parseSitemapFile('12.xml')).toBe(12);
    for (const bad of ['03.xml', 'x.xml', '3', '3.xml.gz', '-1.xml', ''])
      expect(parseSitemapFile(bad)).toBeNull();
  });
});
