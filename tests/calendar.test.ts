import {
  getNepaliMonthGrid,
  getNepaliMonthLabel,
  getNepaliMonthNames,
  getWeekdayLabels,
  isDateDisabled,
} from '../src/calendar';
import { MAX_BS_DATE, MIN_BS_DATE, SUPPORTED_BS_YEAR_RANGE } from '../src/date';

describe('Nepali calendar helpers', () => {
  it('builds a fixed six-week month grid', () => {
    const grid = getNepaliMonthGrid({ year: 2081, month: 1 });

    expect(grid).toHaveLength(42);
    expect(grid.find((day) => day.key === '2081-01-01')).toMatchObject({
      outsideMonth: false,
      weekday: 6,
    });
  });

  it('clamps the grid at the supported range boundaries instead of throwing', () => {
    const firstMonth = getNepaliMonthGrid({
      month: MIN_BS_DATE.month,
      year: MIN_BS_DATE.year,
    });
    const lastMonth = getNepaliMonthGrid({
      month: MAX_BS_DATE.month,
      year: MAX_BS_DATE.year,
    });

    // BS 2000-01-01 falls on a Wednesday, so the grid cannot include the three
    // out-of-range leading days but must still start on the true first day.
    expect(firstMonth[0]).toMatchObject({ key: '2000-01-01', outsideMonth: false, weekday: 3 });
    expect(firstMonth.some((day) => day.date.year < SUPPORTED_BS_YEAR_RANGE.min)).toBe(false);

    expect(lastMonth.at(-1)).toMatchObject({ key: '2090-12-30', outsideMonth: false });
    expect(lastMonth.some((day) => day.date.year > SUPPORTED_BS_YEAR_RANGE.max)).toBe(false);
  });

  it('labels months and weekdays for English and Nepali locales', () => {
    expect(getNepaliMonthLabel({ year: 2081, month: 1 })).toBe('Baisakh 2081');
    expect(getNepaliMonthLabel({ year: 2081, month: 1 }, 'ne')).toBe('बैशाख २०८१');
    expect(getNepaliMonthNames()[0]).toBe('Baisakh');
    expect(getNepaliMonthNames('ne')[0]).toBe('बैशाख');
    expect(getWeekdayLabels()).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(getWeekdayLabels('en', 'short', 1)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]);
  });

  it('detects disabled dates from ranges, lists, and functions', () => {
    const date = { year: 2081, month: 1, day: 1 };

    expect(
      isDateDisabled(date, undefined, {
        min: { year: 2081, month: 1, day: 2 },
      }),
    ).toBe(true);
    expect(isDateDisabled(date, [{ year: 2081, month: 1, day: 1 }])).toBe(true);
    expect(isDateDisabled(date, (candidate) => candidate.day === 1)).toBe(true);
  });
});
