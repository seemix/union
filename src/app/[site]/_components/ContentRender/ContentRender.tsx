import type { SiteId } from '@/config/sites';
import css from './ContentRender.module.css';
import { ContentLightbox } from './ContentLightbox';
import { parseContent } from './parse-content';

/**
 * WP `content.rendered` → React via `html-react-parser` (server): sanitized, `<img>` →
 * `next/image`, internal `<a>` → `Link`, iframes in a 16:9 wrapper, scrollable tables.
 * Only the lightbox wrapper is a client component.
 */
export function ContentRender({ html, site }: { html: string; site: SiteId }) {
  const { nodes, slides } = parseContent(html, site);
  return (
    <ContentLightbox slides={slides} className={css.post_content}>
      {nodes}
    </ContentLightbox>
  );
}
