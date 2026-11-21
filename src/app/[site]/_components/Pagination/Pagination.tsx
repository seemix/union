import Link from 'next/link';
import { paginationItems } from './items';
import css from './Pagination.module.css';

/**
 * Pager made of plain `<Link>`s (crawlable, no `router.push`). Page 1 is the bare
 * `basePath` (no `/1`), the others `basePath/{n}`. Renders nothing for a single page.
 */
export function Pagination({
  current,
  total,
  basePath,
  hrefOf,
  label,
  prevLabel,
  nextLabel,
  pageLabel,
}: {
  current: number;
  total: number;
  /** Path of the first page, no trailing slash (already encoded). */
  basePath: string;
  /** Overrides `basePath` page URLs (e.g. `/search?q=…&page=n`); receives the page number. */
  hrefOf?: (page: number) => string;
  /** `aria-label` of the `<nav>`. */
  label: string;
  prevLabel: string;
  nextLabel: string;
  /** Prefix of the per-page link label, e.g. "Page" → "Page 3". */
  pageLabel: string;
}) {
  if (total < 2) return null;
  const href = hrefOf ?? ((page: number) => (page > 1 ? `${basePath}/${page}` : basePath));

  return (
    <nav aria-label={label} className={css.pagination_wrapper}>
      {current > 1 && (
        <Link href={href(current - 1)} className={css.pagination} aria-label={prevLabel}>
          ⬅
        </Link>
      )}
      {paginationItems(current, total).map((item, i) =>
        item === 'dots' ? (
          <div key={`dots-${i}`} className={css.dots} aria-hidden />
        ) : item === current ? (
          <span key={item} className={`${css.pagination} ${css.active}`} aria-current="page">
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className={css.pagination}
            aria-label={`${pageLabel} ${item}`}
          >
            {item}
          </Link>
        ),
      )}
      {current < total && (
        <Link href={href(current + 1)} className={css.pagination} aria-label={nextLabel}>
          <span aria-hidden="true">➡</span>
        </Link>
      )}
    </nav>
  );
}
