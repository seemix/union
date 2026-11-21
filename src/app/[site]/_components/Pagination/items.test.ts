import { describe, expect, it } from 'vitest';
import { paginationItems } from './items';

describe('paginationItems', () => {
  it('single page', () => {
    expect(paginationItems(1, 1)).toEqual([1]);
  });
  it('shows every page of a short list', () => {
    expect(paginationItems(1, 4)).toEqual([1, 2, 3, 4]);
  });
  it('collapses the middle of a long list from the start', () => {
    expect(paginationItems(1, 20)).toEqual([1, 2, 3, 'dots', 19, 20]);
  });
  it('collapses both sides in the middle', () => {
    expect(paginationItems(10, 20)).toEqual([1, 2, 'dots', 7, 8, 9, 10, 11, 12, 'dots', 19, 20]);
  });
  it('collapses the head at the end', () => {
    expect(paginationItems(20, 20)).toEqual([1, 2, 'dots', 17, 18, 19, 20]);
  });
});
