import { splitByQuery } from '@/lib/search/query';
import css from './Highlight.module.css';

/**
 * Plain text with the words of `query` wrapped in `<mark>`. Parts are rendered as React
 * text children (escaped by React), never as an HTML string.
 */
export function Highlight({ text, query }: { text: string; query: string }) {
  return splitByQuery(text, query).map((part, i) =>
    part.match ? (
      <mark key={i} className={css.mark}>
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}
