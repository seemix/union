/**
 * "Bible in a year", one entry per reading day. Same shape for every site, two lengths:
 * - 365 entries: common-year days (0 = 1 Jan … 364 = 31 Dec); 29 Feb repeats 28 Feb;
 * - 366 entries: leap-year days (0 = 1 Jan, 59 = 29 Feb … 365 = 31 Dec); in common
 *   years the 29 Feb entry is skipped.
 * Either way a calendar date maps to the same entry in every year.
 */
export type BiblePlan = readonly string[];
