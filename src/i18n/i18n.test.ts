import { describe, expect, it } from 'vitest';
import { SITE_IDS } from '@/config/sites';
import { formatDate, formatNumber, getDictionary } from './index';
import { ru } from './ru';
import { ro } from './ro';

function keyPaths(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keyPaths(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

function values(obj: object): string[] {
  return Object.values(obj).flatMap((v) => (v && typeof v === 'object' ? values(v) : [v]));
}

describe('dictionaries', () => {
  it('ro has the same keys as ru', () => {
    expect(keyPaths(ro).sort()).toEqual(keyPaths(ru).sort());
  });

  it('every value is a non-empty string', () => {
    for (const v of [...values(ru), ...values(ro)]) {
      expect(typeof v).toBe('string');
      expect(v.trim()).not.toBe('');
    }
  });

  it('ro has no Cyrillic (legacy bug: Russian strings on ro)', () => {
    for (const v of values(ro)) expect(v).not.toMatch(/[Ѐ-ӿ]/);
  });

  it.each(SITE_IDS)('getDictionary(%s)', async (site) => {
    expect(await getDictionary(site)).toBe(site === 'ru' ? ru : ro);
  });

  it('fixes the known ro bugs', () => {
    expect(ro.search.results).toBe('rezultatele căutării');
    expect(ro.error.title).toBe('Eroare');
  });
});

describe('formatDate', () => {
  it.each(SITE_IDS)('WP local date → DD.MM.YYYY (%s)', (site) => {
    expect(formatDate('2024-05-01T23:30:00', site)).toBe('01.05.2024');
    expect(formatDate('2024-02-29', site)).toBe('29.02.2024');
  });

  it('offset dates are shown in Chisinau time', () => {
    // 22:30Z on 31 Dec = 00:30 on 1 Jan in Chisinau (UTC+2).
    expect(formatDate('2023-12-31T22:30:00Z', 'ro')).toBe('01.01.2024');
    expect(formatDate(new Date('2023-12-31T22:30:00Z'), 'ru')).toBe('01.01.2024');
  });

  it('invalid input → empty string', () => {
    expect(formatDate('nope', 'ru')).toBe('');
    expect(formatDate(new Date(NaN), 'ro')).toBe('');
  });
});

describe('formatNumber', () => {
  const norm = (s: string) => s.replace(/[  ]/g, ' ');

  it('ru groups with spaces', () => {
    expect(norm(formatNumber(12345, 'ru'))).toBe('12 345');
  });

  it('ro groups with dots', () => {
    expect(formatNumber(12345, 'ro')).toBe('12.345');
  });

  it('small numbers unchanged', () => {
    expect(formatNumber(7, 'ru')).toBe('7');
  });
});
