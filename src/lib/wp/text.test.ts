import { describe, expect, it } from 'vitest';
import { decodeEntities, excerptOf, featuredImage, plainText } from './text';

describe('decodeEntities', () => {
  it('decodes numeric, hex and named entities', () => {
    expect(decodeEntities('a &#8211; b &#x2014; c &amp; d &laquo;e&raquo;')).toBe(
      'a – b — c & d «e»',
    );
  });
  it('leaves unknown entities alone', () => {
    expect(decodeEntities('&foo; &#99999999;')).toBe('&foo; &#99999999;');
  });
});

describe('plainText', () => {
  it('strips tags and collapses whitespace', () => {
    expect(plainText('<p>Hello&nbsp;<b>world</b>\n</p>')).toBe('Hello world');
  });
});

describe('excerptOf', () => {
  it('returns empty for no words', () => {
    expect(excerptOf('<p>Text.</p>', 0)).toBe('');
  });
  it('takes two sentences, cut to N words', () => {
    expect(excerptOf('<p>One two three. Four five. Six.</p>', 50)).toBe(
      'One two three. Four five...',
    );
    expect(excerptOf('<p>One two three. Four five.</p>', 2)).toBe('One two...');
  });
});

describe('featuredImage', () => {
  it('prefers the large size', () => {
    const post = {
      _embedded: {
        'wp:featuredmedia': [
          {
            id: 1,
            alt_text: 'alt',
            source_url: 'https://x/full.jpg',
            media_details: {
              sizes: {
                large: { width: 1, height: 1, source_url: 'https://x/large.jpg', mime_type: '' },
              },
            },
          },
        ],
      },
    };
    expect(featuredImage(post)).toEqual({ src: 'https://x/large.jpg', alt: 'alt' });
  });
  it('is null for missing media or an embedded error', () => {
    expect(featuredImage({})).toBeNull();
    expect(
      featuredImage({ _embedded: { 'wp:featuredmedia': [{ code: 'x', message: 'y' }] } }),
    ).toBeNull();
  });
});
