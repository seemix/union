import type { SiteId } from '@/config/sites';
import { roPlan } from './ro';
import { ruPlan } from './ru';
import type { BiblePlan } from './types';

export type { BiblePlan } from './types';

/** Calendar the readers live in (same as `formatDate`). */
const SITE_TIME_ZONE = 'Europe/Chisinau';

const COMMON_YEAR_DAYS = 365;
const LEAP_YEAR_DAYS = 366;

const PLANS: Readonly<Record<SiteId, BiblePlan>> = { ru: ruPlan, ro: roPlan };

/** Days before each month in a leap year (Jan..Dec). */
const LEAP_DAYS_BEFORE_MONTH = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335] as const;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: SITE_TIME_ZONE,
});

/**
 * 0-based day-of-year of a calendar date counted as if the year were a leap
 * year (1 Jan = 0, 29 Feb = 59, 31 Dec = 365).
 */
export function planIndexForMonthDay(month: number, day: number): number {
  const before = LEAP_DAYS_BEFORE_MONTH[month - 1];
  if (before === undefined || !Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError(`Invalid month/day: ${month}/${day}`);
  }
  return before + day - 1;
}

/** Reading for `date` (its Chisinau calendar day) in the site's plan. */
export function getReadingForDate(site: SiteId, date: Date): string {
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid date');
  const parts = partsFormatter.formatToParts(date);
  const pick = (type: 'month' | 'day') => Number(parts.find((p) => p.type === type)?.value);
  const plan = PLANS[site];
  const leapIndex = planIndexForMonthDay(pick('month'), pick('day'));
  let index = leapIndex;
  if (plan.length === COMMON_YEAR_DAYS)
    index = leapIndex <= 59 ? Math.min(leapIndex, 58) : leapIndex - 1;
  const reading = plan[index];
  if (reading === undefined) {
    throw new Error(
      `Bible plan "${site}" must have ${COMMON_YEAR_DAYS} or ${LEAP_YEAR_DAYS} entries`,
    );
  }
  return reading;
}
