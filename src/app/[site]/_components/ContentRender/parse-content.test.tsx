import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SiteId } from '@/config/sites';
import { resolveEmbed } from './embed';
import { fullSizeSrc, parseContent } from './parse-content';

function render(html: string, site: SiteId = 'ro') {
  const { nodes, slides } = parseContent(html, site, 'Video');
  return { html: renderToStaticMarkup(<>{nodes}</>), slides };
}

describe('images', () => {
  const wp =
    '<img src="https://baptist.org.md/wp-content/uploads/a-300x200.jpg" alt="Biserica" width="300" height="200" />';

  it('known size on the WP host → next/image with alt, lazy', () => {
    const { html } = render(wp);
    expect(html).toContain('/_next/image?url=');
    expect(html).toContain('alt="Biserica"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width="300"');
  });

  it('http WP host is upgraded and still optimized', () => {
    const { html } = render(wp.replace('https:', 'http:'));
    expect(html).toContain('/_next/image?url=https%3A%2F%2Fbaptist.org.md');
  });

  it('unknown size → plain lazy img keeping alt and src', () => {
    const { html } = render('<img src="https://baptist.org.md/x.jpg" alt="A" />');
    expect(html).not.toContain('/_next/image');
    expect(html).toContain('src="https://baptist.org.md/x.jpg"');
    expect(html).toContain('alt="A"');
    expect(html).toContain('loading="lazy"');
  });

  it('foreign host or gif is not optimized even with a size', () => {
    expect(
      render('<img src="https://static.wixstatic.com/a.jpg" alt="" width="10" height="10">').html,
    ).not.toContain('/_next/image');
    expect(
      render('<img src="https://baptist.org.md/a.gif" alt="" width="10" height="10">').html,
    ).not.toContain('/_next/image');
  });

  it('missing alt becomes an empty alt; missing src drops the image', () => {
    expect(render('<img src="https://baptist.org.md/x.jpg">').html).toContain('alt=""');
    expect(render('<p>a<img alt="x">b</p>').html).toBe('<p>ab</p>');
  });

  it('every photo becomes a lightbox slide with the full-size url, in order', () => {
    const { html, slides } = render(
      `${wp}<p>text</p><img src="https://baptist.org.md/b-150x150.png" alt="B">`,
    );
    expect(slides).toEqual([
      { src: 'https://baptist.org.md/wp-content/uploads/a.jpg', alt: 'Biserica' },
      { src: 'https://baptist.org.md/b.png', alt: 'B' },
    ]);
    expect(html).toContain('data-lightbox-index="0"');
    expect(html).toContain('data-lightbox-index="1"');
  });

  it('smileys and images linking to a page are not lightbox slides', () => {
    const { html, slides } = render(
      '<img class="wp-smiley" src="https://baptist.org.md/s.png" alt=":)">' +
        '<a href="/post?id=1"><img src="https://baptist.org.md/b.jpg" alt="banner"></a>' +
        '<a href="https://baptist.org.md/big.jpg"><img src="https://baptist.org.md/big-1x1.jpg" alt="p"></a>',
    );
    expect(slides).toHaveLength(1);
    expect(html.match(/data-lightbox-index/g)).toHaveLength(1);
  });

  it('fullSizeSrc strips the WP size suffix only', () => {
    expect(fullSizeSrc('https://x/a-1024x768.jpg')).toBe('https://x/a.jpg');
    expect(fullSizeSrc('https://x/a-2024.jpg')).toBe('https://x/a-2024.jpg');
  });
});

describe('links', () => {
  it('legacy /post?id= and own WP URLs → next/link routes without target', () => {
    const { html } = render(
      '<a href="/post?id=16303">a</a><a href="https://baptist.org.md/ro/category/stiri/" class="c">b</a>',
    );
    expect(html).toContain('<a href="/post?id=16303">a</a>');
    expect(html).toContain('<a class="c" href="/category/stiri">b</a>');
    expect(html).not.toContain('target=');
  });

  it('external links open in a new tab with noopener noreferrer', () => {
    const { html } = render('<a href="https://example.com/x" target="_self" rel="x">e</a>');
    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('other site of the union is external with its domain', () => {
    const { html } = render('<a href="https://baptist.org.md/ro/category/stiri/">r</a>', 'ru');
    expect(html).toContain('href="https://ro.baptist.org.md/category/stiri"');
    expect(html).toContain('target="_blank"');
  });

  it('mailto/tel and anchors do not open a new tab', () => {
    const { html } = render('<a href="mailto:a@b.md">m</a><a href="#n1">n</a>');
    expect(html).toContain('href="mailto:a@b.md"');
    expect(html).toContain('href="#n1"');
    expect(html).not.toContain('target=');
  });
});

describe('iframes', () => {
  it('YouTube is wrapped 16:9, lazy, https, without fixed size', () => {
    const { html } = render(
      '<iframe width="560" height="315" src="//www.youtube.com/embed/abc" allowfullscreen></iframe>',
    );
    expect(html).toMatch(/^<div class="[^"]*embed[^"]*"><iframe /);
    expect(html).toContain('src="https://www.youtube.com/embed/abc"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('title="Video"');
    expect(html).not.toContain('width="560"');
  });

  it('Vimeo and Facebook get the same wrapper', () => {
    expect(render('<iframe src="https://player.vimeo.com/video/1"></iframe>').html).toContain(
      'embed',
    );
    expect(
      render('<iframe src="https://www.facebook.com/plugins/video.php?x=1"></iframe>').html,
    ).toContain('embed');
  });

  it('audio players keep their own height; other hosts and non-http are dropped', () => {
    const audio = render(
      '<iframe src="https://widget.spreaker.com/player?x=1" height="200"></iframe>',
    );
    expect(audio.html).not.toContain('embed');
    expect(audio.html).toContain('height="200"');
    expect(render('<iframe src="https://evil.example/x"></iframe>').html).toBe('');
    expect(render('<iframe src="javascript:alert(1)"></iframe>').html).toBe('');
    expect(
      render('<iframe src="https://www.youtube.com/embed/a" srcdoc="<script>"></iframe>').html,
    ).not.toContain('srcdoc');
  });

  it('resolveEmbed upgrades http and classifies hosts', () => {
    expect(resolveEmbed('http://www.youtube.com/embed/a')).toEqual({
      src: 'https://www.youtube.com/embed/a',
      video: true,
    });
    expect(resolveEmbed('https://drive.google.com/file/d/1/preview')?.video).toBe(false);
    expect(resolveEmbed(undefined)).toBeNull();
  });
});

describe('tables', () => {
  it('are wrapped in a horizontal scroll container', () => {
    const { html } = render('<table><tbody><tr><td>1</td></tr></tbody></table>');
    expect(html).toMatch(/^<div class="[^"]*table_scroll[^"]*"><table>/);
    expect(html).toContain('<td>1</td>');
  });
});

describe('sanitizing', () => {
  it('removes script and other blocked elements with their content', () => {
    const { html } = render(
      '<p>a</p><script>alert(1)</script><object data="x"></object><embed src="x"><form action="/x"><input></form><p>b</p>',
    );
    expect(html).toBe('<p>a</p><p>b</p>');
  });

  it('removes on* attributes (any case)', () => {
    const { html } = render('<p onclick="x()" ONMOUSEOVER="y()" class="k">t</p>');
    expect(html).toBe('<p class="k">t</p>');
    expect(
      render('<img src="https://baptist.org.md/a.jpg" onerror="x()" alt="a">').html,
    ).not.toMatch(/onerror/i);
  });

  it('drops SVG/SMIL animation that could rewrite href', () => {
    const { html } = render(
      '<svg><a><set attributeName="href" to="javascript:alert(1)"/>' +
        '<animate attributeName="href" values="javascript:alert(1)"/><text>x</text></a></svg>',
    );
    expect(html).not.toContain('javascript');
    expect(html).not.toMatch(/<(set|animate)\b/i);
    expect(html).toContain('<text>x</text>');
  });

  it('keeps <style> from WP gallery output', () => {
    expect(render('<style>#gallery-1 { margin: auto; }</style>').html).toContain('<style>');
  });

  it('removes javascript: / vbscript: / data: URLs, also obfuscated', () => {
    expect(render('<a href="javascript:alert(1)">x</a>').html).toBe('<a>x</a>');
    expect(render('<a href="  JAVASCRIPT:alert(1)">x</a>').html).toBe('<a>x</a>');
    expect(render('<a href="java&#9;script:alert(1)">x</a>').html).toBe('<a>x</a>');
    expect(render('<a href="vbscript:x">x</a>').html).toBe('<a>x</a>');
    expect(render('<a href="data:text/html;base64,AAAA">x</a>').html).toBe('<a>x</a>');
    expect(render('<img src="javascript:alert(1)" alt="a">').html).not.toContain('javascript');
  });

  it('allows raster data: images in img src', () => {
    expect(render('<img src="data:image/png;base64,AAAA" alt="a">').html).toContain(
      'src="data:image/png;base64,AAAA"',
    );
    expect(render('<img src="data:image/svg+xml;base64,AAAA" alt="a">').html).not.toContain(
      'data:',
    );
  });
});

describe('legacy text fixes (Q19)', () => {
  it('keeps the old entity replacements and unwraps <center>', () => {
    expect(render('<p>&#8220;a&#8221; &#8211; b&nbsp;c <center>d</center></p>').html).toBe(
      '<p>&quot;a&quot; - bc d</p>',
    );
  });
});
