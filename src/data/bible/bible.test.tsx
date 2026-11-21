import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Widgets } from '@/app/[site]/_components/Widgets/Widgets';
import { getSite, type SiteId } from '@/config/sites';
import { getReadingForDate, planIndexForMonthDay } from './index';
import { roPlan } from './ro';
import { ruPlan } from './ru';

// Noon UTC = same calendar day in Chisinau (UTC+2/+3).
const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12));
const nth = (y: number, i: number) => new Date(Date.UTC(y, 0, 1 + i, 12));

describe('plans (ported from legacy)', () => {
  it('ru has 365 entries (master), ro has 366 (romana)', () => {
    expect(ruPlan).toHaveLength(365);
    expect(roPlan).toHaveLength(366);
  });

  it.each([
    ['ru', ruPlan],
    ['ro', roPlan],
  ])('%s: no empty or padded entries, none repeated', (_, plan) => {
    expect(plan.every((e) => e.trim() === e && e.length > 0)).toBe(true);
    expect(new Set(plan).size).toBe(plan.length);
  });

  it('start with Genesis and end with Revelation', () => {
    expect(ruPlan[0]).toBe('Быт. 1, 2, 3');
    expect(ruPlan.at(-1)).toBe('Откр. 20, 21, 22');
    expect(roPlan[0]).toBe('Geneza 1-2');
    expect(roPlan.at(-1)).toBe('Apocalipsa 19-22');
  });
});

describe('planIndexForMonthDay', () => {
  it('counts as in a leap year (0-based)', () => {
    expect(planIndexForMonthDay(1, 1)).toBe(0);
    expect(planIndexForMonthDay(2, 28)).toBe(58);
    expect(planIndexForMonthDay(2, 29)).toBe(59);
    expect(planIndexForMonthDay(3, 1)).toBe(60);
    expect(planIndexForMonthDay(12, 31)).toBe(365);
  });
  it('rejects invalid input', () => {
    expect(() => planIndexForMonthDay(13, 1)).toThrow(RangeError);
    expect(() => planIndexForMonthDay(1, 0)).toThrow(RangeError);
  });
});

describe('getReadingForDate — 366-entry plan (ro)', () => {
  it('leap year: each date maps to its own entry in order, 29 Feb included', () => {
    for (let i = 0; i < 366; i++) {
      expect(getReadingForDate('ro', nth(2024, i))).toBe(roPlan[i]);
    }
    expect(getReadingForDate('ro', day(2024, 2, 29))).toBe(roPlan[59]);
  });

  it('common year: same dates, 29 Feb entry is skipped, 31 Dec is the last', () => {
    expect(getReadingForDate('ro', day(2025, 2, 28))).toBe(roPlan[58]);
    expect(getReadingForDate('ro', day(2025, 3, 1))).toBe(roPlan[60]);
    expect(getReadingForDate('ro', day(2025, 12, 31))).toBe(roPlan[365]);
  });
});

describe('getReadingForDate — 365-entry plan (ru)', () => {
  it('common year: each date maps to its own entry in order, 31 Dec is the last', () => {
    for (let i = 0; i < 365; i++) {
      expect(getReadingForDate('ru', nth(2025, i))).toBe(ruPlan[i]);
    }
    expect(getReadingForDate('ru', day(2025, 12, 31))).toBe(ruPlan[364]);
  });

  it('leap year: 29 Feb repeats 28 Feb, everything after keeps its date', () => {
    expect(getReadingForDate('ru', day(2024, 2, 28))).toBe(ruPlan[58]);
    expect(getReadingForDate('ru', day(2024, 2, 29))).toBe(ruPlan[58]);
    expect(getReadingForDate('ru', day(2024, 3, 1))).toBe(ruPlan[59]);
    expect(getReadingForDate('ru', day(2024, 12, 31))).toBe(ruPlan[364]);
    expect(getReadingForDate('ru', day(2024, 1, 1))).toBe(ruPlan[0]);
  });
});

describe('getReadingForDate — edge cases', () => {
  it('uses the Chisinau calendar day, not the server one', () => {
    // 22:30 UTC on 31 Dec is already 1 Jan in Chisinau.
    const date = new Date(Date.UTC(2025, 11, 31, 22, 30));
    expect(getReadingForDate('ru', date)).toBe(ruPlan[0]);
    expect(getReadingForDate('ro', date)).toBe(roPlan[0]);
  });

  it('rejects an invalid date', () => {
    expect(() => getReadingForDate('ru', new Date(NaN))).toThrow(RangeError);
  });
});

describe('Bible widget (Widgets)', () => {
  const bibleOnly = (site: SiteId) => getSite(site).widgets.filter((w) => w.type === 'bible');
  it('renders without a link, with the label and the day reading', () => {
    const html = renderToStaticMarkup(
      <Widgets site="ru" widgets={bibleOnly('ru')} today={day(2025, 1, 1)} />,
    );
    expect(html).not.toContain('<a');
    expect(html).not.toContain('href');
    expect(html).toContain('Библия за год');
    expect(html).toContain('Быт. 1, 2, 3');
  });

  it('renders for ro too', () => {
    const html = renderToStaticMarkup(
      <Widgets site="ro" widgets={bibleOnly('ro')} today={day(2025, 1, 1)} />,
    );
    expect(html).toContain('Biblia peste un an');
    expect(html).toContain('Geneza 1-2');
  });
});
