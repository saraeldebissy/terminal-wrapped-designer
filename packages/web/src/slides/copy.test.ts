import { describe, it, expect } from 'vitest';
import { fmt, hourLabel, topCategoryPct, copy } from './copy';

describe('copy helpers', () => {
  it('formats numbers with thousands separators', () => {
    expect(fmt(1000)).toBe('1,000');
    expect(fmt(42)).toBe('42');
  });

  it('formats hours as 12-hour labels', () => {
    expect(hourLabel(0)).toBe('12AM');
    expect(hourLabel(2)).toBe('2AM');
    expect(hourLabel(14)).toBe('2PM');
    expect(hourLabel(23)).toBe('11PM');
  });

  it('computes the top category percentage of total', () => {
    expect(topCategoryPct(620, 1000)).toBe(62);
  });

  it('exposes a deadpan cover title', () => {
    expect(copy.coverTitle).toMatch(/shell/i);
  });
});
