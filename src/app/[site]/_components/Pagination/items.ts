export type PaginationItem = number | 'dots';

/**
 * Page numbers shown by the pager, as in legacy: the first two pages (once past page 3),
 * a window `current-3 … current+2`, the last two pages (while 3+ pages remain);
 * `'dots'` wherever pages are skipped.
 */
export function paginationItems(current: number, total: number): PaginationItem[] {
  const shown = new Set<number>();
  for (let p = 1; p <= total; p++) {
    if (current > 3 && p < 3) shown.add(p);
    else if (p - current < 3 && current - p < 4) shown.add(p);
    else if (total - current > 2 && total - p < 2) shown.add(p);
  }
  const items: PaginationItem[] = [];
  let prev = 0;
  for (const p of [...shown].sort((a, b) => a - b)) {
    if (prev && p - prev > 1) items.push('dots');
    items.push(p);
    prev = p;
  }
  return items;
}
