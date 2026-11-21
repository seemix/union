import { afterEach, describe, expect, it, vi } from 'vitest';

const getPageById = vi.fn();
const getCategoryById = vi.fn();
vi.mock('@/lib/wp', () => ({ getPageById, getCategoryById }));

const { resolveTargetHrefs } = await import('./targets');
const { hrefOf } = await import('./href');

afterEach(() => vi.resetAllMocks());

describe('resolveTargetHrefs', () => {
  it('maps config targets to their slug routes, once per target', async () => {
    getPageById.mockResolvedValue({ id: 893, slug: 'istoria' });
    getCategoryById.mockResolvedValue({
      id: 23,
      slug: '%d0%bd%d0%be%d0%b2%d0%be%d1%81%d1%82%d0%b8',
    });
    const page = { kind: 'page', id: 893 } as const;
    const category = { kind: 'category', id: 23 } as const;
    const hrefs = await resolveTargetHrefs('ro', [page, category, page]);
    expect(hrefOf(hrefs, page)).toBe('/page/istoria');
    expect(hrefOf(hrefs, category)).toBe('/category/%D0%BD%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D0%B8');
    expect(getPageById).toHaveBeenCalledTimes(1);
  });

  it('keeps the legacy ?id= href when the entity is gone or WP fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPageById.mockResolvedValue(null);
    getCategoryById.mockRejectedValue(new Error('WP down'));
    const page = { kind: 'page', id: 1 } as const;
    const category = { kind: 'category', id: 2 } as const;
    const hrefs = await resolveTargetHrefs('ru', [page, category]);
    expect(hrefOf(hrefs, page)).toBe('/page?id=1');
    expect(hrefOf(hrefs, category)).toBe('/category?id=2');
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});
