import { createElement, type ReactElement, type ReactNode } from 'react';
import { SafeImage } from '../SafeImage/SafeImage';
import Link from 'next/link';
import parse, {
  attributesToProps,
  domToReact,
  Element,
  type DOMNode,
  type HTMLReactParserOptions,
} from 'html-react-parser';
import type { SiteId } from '@/config/sites';
import { resolveContentHref } from '@/lib/wp/content-url';
import css from './ContentRender.module.css';
import { resolveEmbed } from './embed';
import { BLOCKED_TAGS, isAllowedAttribute } from './sanitize';

export interface ContentSlide {
  readonly src: string;
  readonly alt?: string;
}

export interface ParsedContent {
  readonly nodes: ReactNode;
  /** Lightbox slides in document order; `data-lightbox-index` on `<img>` points here. */
  readonly slides: readonly ContentSlide[];
}

const WP_HOST = 'baptist.org.md';
const IMAGE_URL = /\.(?:jpe?g|png|gif|webp|avif)(?:[?#]|$)/i;
const SIZE_SUFFIX = /-\d+x\d+(_[a-zA-Zа-яА-Я0-9]+)?\./;
const NEW_TAB = /^(?:https?:)?\/\//i;

/** Legacy `contentTransformer` text fixes, 1:1 (Q19). The iframe wrapper is now a component. */
const LEGACY_REPLACEMENTS: Readonly<Record<string, string>> = {
  '&#8220;': '"',
  '&#8211;': '-',
  '&#8221;': '"',
  '&quot;': '',
  '&nbsp;': '',
  '<center>': '',
  '</center>': '',
};
const LEGACY_PATTERN = new RegExp(Object.keys(LEGACY_REPLACEMENTS).join('|'), 'g');

export function legacyText(html: string): string {
  return html.replace(LEGACY_PATTERN, (m) => LEGACY_REPLACEMENTS[m] ?? m);
}

/** `-300x200` thumbnail → the full-size upload (legacy `imageParser`). */
export function fullSizeSrc(src: string): string {
  return src.replace(SIZE_SUFFIX, '.');
}

function upgradeWpHttp(src: string): string {
  return src.replace(new RegExp(`^http://${WP_HOST}/`, 'i'), `https://${WP_HOST}/`);
}

function positiveInt(value: string | undefined): number | null {
  if (!value || !/^\d{1,5}$/.test(value)) return null;
  const n = Number(value);
  return n > 0 ? n : null;
}

/** `next/image` only for the WP media host (the only `remotePatterns` entry) or own paths. */
function canOptimize(src: string): boolean {
  if (/\.(?:gif|svg)(?:[?#]|$)/i.test(src)) return false; // animated / vector: serve as is
  if (src.startsWith('/') && !src.startsWith('//')) return true;
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && url.hostname === WP_HOST;
  } catch {
    return false;
  }
}

function toProps(el: Element): Record<string, unknown> {
  return attributesToProps(el.attribs, el.name) as Record<string, unknown>;
}

/** `embedTitle`: localized `title` for an iframe that has none (a11y). */
export function parseContent(html: string, site: SiteId, embedTitle: string): ParsedContent {
  const slides: ContentSlide[] = [];

  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!(node instanceof Element)) return undefined;
      const tag = node.name.toLowerCase();

      if (BLOCKED_TAGS.has(tag)) return <></>;

      // Sanitize in place: the parser visits a node before its children / serialization.
      for (const [name, value] of Object.entries(node.attribs)) {
        if (!isAllowedAttribute(tag, name, value)) delete node.attribs[name];
      }

      switch (tag) {
        case 'img':
          return renderImage(node, slides);
        case 'a':
          return renderLink(node, site, options);
        case 'iframe':
          return renderIframe(node, embedTitle);
        case 'table':
          return (
            <div className={css.table_scroll}>
              {createElement(
                'table',
                toProps(node),
                domToReact(node.children as DOMNode[], options),
              )}
            </div>
          );
        default:
          return undefined;
      }
    },
  };

  return { nodes: parse(legacyText(html), options), slides };
}

function renderImage(node: Element, slides: ContentSlide[]): ReactElement {
  const { src: rawSrc = '', alt = '' } = node.attribs;
  if (!rawSrc) return <></>;
  const src = upgradeWpHttp(rawSrc.trim());
  const props = toProps(node);
  for (const key of ['src', 'srcSet', 'sizes', 'alt', 'loading', 'width', 'height']) {
    delete props[key];
  }

  const classes = String(node.attribs.class ?? '');
  const parent = node.parent instanceof Element ? node.parent : null;
  const linkHref = parent?.name === 'a' ? (parent.attribs.href ?? '') : '';
  const zoomable =
    !/\b(?:wp-smiley|emoji)\b/.test(classes) && (linkHref === '' || IMAGE_URL.test(linkHref));

  const extra: Record<string, unknown> = {};
  if (zoomable) {
    extra['data-lightbox-index'] = slides.length;
    extra.role = 'button';
    extra.tabIndex = 0;
    slides.push({ src: fullSizeSrc(src), alt: alt || undefined });
  }

  const width = positiveInt(node.attribs.width);
  const height = positiveInt(node.attribs.height);
  if (width && height && canOptimize(src)) {
    return (
      <SafeImage
        {...props}
        {...extra}
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 800px) 100vw, 800px"
      />
    );
  }

  const { srcset, sizes } = node.attribs;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- unknown size or foreign host: cannot be optimized
    <img {...props} {...extra} src={src} alt={alt} srcSet={srcset} sizes={sizes} loading="lazy" />
  );
}

function renderLink(node: Element, site: SiteId, options: HTMLReactParserOptions): ReactElement {
  const props = toProps(node);
  delete props.href;
  delete props.target;
  delete props.rel;
  const children = domToReact(node.children as DOMNode[], options);

  const raw = node.attribs.href;
  const resolved = raw === undefined ? null : resolveContentHref(raw, site);
  if (!resolved) return createElement('a', props, children); // no href / unsafe href dropped

  if (!resolved.external) {
    return resolved.href.startsWith('#') ? (
      createElement('a', { ...props, href: resolved.href }, children)
    ) : (
      <Link {...props} href={resolved.href}>
        {children}
      </Link>
    );
  }
  const newTab = NEW_TAB.test(resolved.href);
  return createElement(
    'a',
    {
      ...props,
      href: resolved.href,
      ...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    },
    children,
  );
}

function renderIframe(node: Element, fallbackTitle: string): ReactElement {
  const embed = resolveEmbed(node.attribs.src);
  if (!embed) return <></>;
  const { title, allow, height } = node.attribs;
  const frame = (
    <iframe
      src={embed.src}
      title={title || fallbackTitle}
      allow={allow}
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      {...(embed.video ? {} : { height: positiveInt(height) ?? 200, width: '100%' })}
    />
  );
  return embed.video ? <div className={css.embed}>{frame}</div> : frame;
}
