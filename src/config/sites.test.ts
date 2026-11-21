import { describe, expect, it } from 'vitest';
import { getSite, isSiteId, siteByHost } from './sites';

describe('siteByHost', () => {
  it.each([
    ['ru.baptist.org.md', 'ru'],
    ['ro.baptist.org.md', 'ro'],
    ['next.ru.baptist.org.md', 'ru'],
    ['next.ro.baptist.org.md', 'ro'],
    ['ru.localhost', 'ru'],
    ['ro.localhost:3000', 'ro'],
    ['next.ro.localhost:3000', 'ro'],
    ['RU.Baptist.Org.MD', 'ru'],
    ['ro.baptist.org.md:443', 'ro'],
    ['ro.baptist.org.md.', 'ro'],
  ])('%s → %s', (host, id) => {
    expect(siteByHost(host)?.id).toBe(id);
  });

  it.each([
    'localhost',
    'localhost:3000',
    'baptist.org.md',
    'www.ru.baptist.org.md',
    'evil.com',
    'ru.baptist.org.md.evil.com',
    'xru.localhost',
    'en.localhost',
    '__proto__.localhost',
    '',
  ])('%j → null', (host) => {
    expect(siteByHost(host)).toBeNull();
  });

  it('handles null/undefined', () => {
    expect(siteByHost(null)).toBeNull();
    expect(siteByHost(undefined)).toBeNull();
  });
});

describe('helpers', () => {
  it('isSiteId', () => {
    expect(isSiteId('ru')).toBe(true);
    expect(isSiteId('ro')).toBe(true);
    expect(isSiteId('en')).toBe(false);
    expect(isSiteId('toString')).toBe(false);
    expect(isSiteId(undefined)).toBe(false);
  });

  it('getSite returns matching config', () => {
    expect(getSite('ro').wp.menuId).toBe(76);
    expect(getSite('ru').wp.menuId).toBe(154);
    expect(getSite('ro').lang).toBe('ro');
  });
});
