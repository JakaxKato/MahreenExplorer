import { describe, expect, it } from 'vitest';
import { worksQuerySchema } from '../validators/works.js';

describe('worksQuerySchema', () => {
  it('applies pagination and sort defaults', () => {
    expect(worksQuerySchema.parse({})).toEqual({ page: 1, limit: 12, sort: 'newest' });
  });

  it('coerces numeric filters and accepts supported sort values', () => {
    expect(worksQuerySchema.parse({ year: '2026', page: '2', limit: '50', sort: 'title' })).toEqual({ year: 2026, page: 2, limit: 50, sort: 'title' });
  });

  it('rejects invalid limits, pages, and sort values', () => {
    expect(worksQuerySchema.safeParse({ limit: '51' }).success).toBe(false);
    expect(worksQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(worksQuerySchema.safeParse({ sort: 'random' }).success).toBe(false);
  });
});
