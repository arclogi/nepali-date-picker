import {
  MAX_BS_DATE,
  MIN_BS_DATE,
  addNepaliDays,
  addNepaliMonths,
  clampNepaliDate,
  compareNepaliDates,
  formatNepaliDate,
  getDaysInNepaliMonth,
  isValidNepaliDate,
  parseNepaliDate,
  toAD,
  toBS,
  toNepaliDateKey,
} from '../src/date';

describe('Nepali date utilities', () => {
  it('converts BS dates to local-noon AD dates', () => {
    const adDate = toAD({ year: 2081, month: 1, day: 1 });

    expect(adDate.getFullYear()).toBe(2024);
    expect(adDate.getMonth()).toBe(3);
    expect(adDate.getDate()).toBe(13);
    expect(adDate.getHours()).toBe(12);
  });

  it('converts AD dates to BS dates', () => {
    expect(toBS(new Date(2024, 3, 13, 12))).toEqual({ year: 2081, month: 1, day: 1 });
    expect(toBS('2025-04-14')).toEqual({ year: 2082, month: 1, day: 1 });
  });

  it('rejects AD dates outside the supported BS range instead of corrupting them', () => {
    // The underlying converter silently mirrors pre-epoch dates; the wrapper must throw.
    expect(() => toBS(new Date(1943, 3, 10, 12))).toThrow(RangeError);
    expect(() => toBS(new Date(2034, 3, 14, 12))).toThrow(RangeError);
    expect(() => addNepaliDays(MIN_BS_DATE, -1)).toThrow(RangeError);
    expect(() => addNepaliDays(MAX_BS_DATE, 1)).toThrow(RangeError);
  });

  it('formats, parses, and validates date values', () => {
    const date = parseNepaliDate('2081-01-01');

    expect(date).toEqual({ year: 2081, month: 1, day: 1 });
    expect(toNepaliDateKey(date)).toBe('2081-01-01');
    expect(formatNepaliDate(date)).toBe('2081-01-01');
    expect(formatNepaliDate(date, 'YYYY MMMM DD')).toBe('2081 Baisakh 01');
    expect(isValidNepaliDate({ year: 2081, month: 2, day: 32 })).toBe(true);
    expect(isValidNepaliDate({ year: 2081, month: 2, day: 33 })).toBe(false);
  });

  it('requires a consistent separator when parsing', () => {
    expect(parseNepaliDate('2081/01/01')).toEqual({ year: 2081, month: 1, day: 1 });
    expect(() => parseNepaliDate('2081-01/01')).toThrow();
  });

  it('exposes reliable month lengths and date comparison', () => {
    expect(getDaysInNepaliMonth(2081, 1)).toBe(31);
    expect(getDaysInNepaliMonth(2081, 2)).toBe(32);
    expect(
      compareNepaliDates({ year: 2081, month: 1, day: 1 }, { year: 2080, month: 12, day: 30 }),
    ).toBeGreaterThan(0);
  });

  it('adds days and months while clamping impossible month dates', () => {
    expect(addNepaliDays({ year: 2081, month: 1, day: 1 }, 1)).toEqual({
      year: 2081,
      month: 1,
      day: 2,
    });
    expect(addNepaliMonths({ year: 2081, month: 10, day: 30 }, 1)).toEqual({
      year: 2081,
      month: 11,
      day: 29,
    });
    expect(addNepaliMonths({ year: 2081, month: 2, day: 32 }, 1)).toEqual({
      year: 2081,
      month: 3,
      day: 31,
    });
  });

  it('clamps dates into a range', () => {
    const min = { year: 2081, month: 1, day: 10 };
    const max = { year: 2081, month: 1, day: 20 };

    expect(clampNepaliDate({ year: 2081, month: 1, day: 5 }, { min, max })).toEqual(min);
    expect(clampNepaliDate({ year: 2081, month: 1, day: 25 }, { min, max })).toEqual(max);
    expect(clampNepaliDate({ year: 2081, month: 1, day: 15 }, { min, max })).toEqual({
      year: 2081,
      month: 1,
      day: 15,
    });
    expect(clampNepaliDate({ year: 2081, month: 1, day: 15 })).toEqual({
      year: 2081,
      month: 1,
      day: 15,
    });
  });
});
