import { isUnsafeUrl, stripUrlNoise } from '@/lib/wp/content-url';

/** Elements that never render from WP content (their children go with them). */
export const BLOCKED_TAGS: ReadonlySet<string> = new Set([
  'script',
  'noscript',
  'object',
  'embed',
  'applet',
  'base',
  'meta',
  'link',
  'form',
]);

const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'xlink:href', 'poster', 'data']);
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp|avif);/i;

/**
 * Whether a source attribute survives. Drops `on*` handlers, `srcdoc` and
 * `javascript:` / `vbscript:` / `data:` URLs (only raster `data:image/*` on `<img src>`).
 */
export function isAllowedAttribute(tag: string, name: string, value: string): boolean {
  const n = name.toLowerCase();
  if (n.startsWith('on') || n === 'srcdoc') return false;
  if (URL_ATTRS.has(n) && isUnsafeUrl(value)) {
    return tag === 'img' && n === 'src' && SAFE_DATA_IMAGE.test(stripUrlNoise(value));
  }
  if (n === 'srcset' && value.split(',').some((c) => isUnsafeUrl(c.trim().split(/\s+/)[0] ?? ''))) {
    return false;
  }
  return true;
}
