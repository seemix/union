import { describe, expect, it } from 'vitest';
import { TtlCache } from './ttl-cache';

describe('TtlCache', () => {
  it('evicts the least recently used entry', () => {
    const c = new TtlCache<number>(2, () => 0);
    c.set('a', 1, 10);
    c.set('b', 2, 10);
    expect(c.get('a')).toBe(1); // a is now the most recent
    c.set('c', 3, 10);
    expect(c.get('b')).toBeUndefined();
    expect(c.get('a')).toBe(1);
    expect(c.get('c')).toBe(3);
    expect(c.size).toBe(2);
  });

  it('expires entries', () => {
    let t = 0;
    const c = new TtlCache<string>(10, () => t);
    c.set('k', 'v', 100);
    t = 99;
    expect(c.get('k')).toBe('v');
    t = 100;
    expect(c.get('k')).toBeUndefined();
    expect(c.size).toBe(0);
  });
});
