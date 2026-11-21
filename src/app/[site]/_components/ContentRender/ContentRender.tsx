import css from './ContentRender.module.css';

/**
 * TEMPORARY (until P4.6): legacy approach — WP `content.rendered` through the legacy
 * `contentTransformer`, injected as HTML. Same markup as legacy `html-to-react`
 * produced, without the lightbox.
 *
 * P4.6 replaces this with `html-react-parser`: `next/image`, internal `<a>` → `Link`,
 * iframe wrappers as components, lightbox — and drops raw HTML injection.
 * Content is authored by the site editors in our own WP (trusted source).
 */
export function ContentRender({ html }: { html: string }) {
  return (
    <div className={css.post_content} dangerouslySetInnerHTML={{ __html: legacyContent(html) }} />
  );
}

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
const IFRAME = /<iframe([^>]*)>([\s\S]*?)<\/iframe>/g;

/** Legacy `common/functions/contentTransformer.ts`, 1:1 (Q19). */
function legacyContent(html: string): string {
  return html
    .replace(LEGACY_PATTERN, (m) => LEGACY_REPLACEMENTS[m] ?? m)
    .replace(IFRAME, '<div class="iframe_container"><iframe$1>$2</iframe></div>');
}
