import {
  getNepaliMonthGrid,
  getNepaliMonthLabel,
  getWeekdayLabels,
  isDateDisabled,
} from '../src/calendar';

describe('Nepali calendar helpers', () => {
  it('builds a fixed six-week month grid', () => {
    const grid = getNepaliMonthGrid({ year: 2081, month: 1 });

    expect(grid).toHaveLength(42);
    expect(grid.find((day) => day.key === '2081-01-01')).toMatchObject({
      outsideMonth: false,
      weekday: 6,
    });
  });

  it('labels months and weekdays for English and Nepali locales', () => {
    expect(getNepaliMonthLabel({ year: 2081, month: 1 })).toBe('Baisakh 2081');
    expect(getNepaliMonthLabel({ year: 2081, month: 1 }, 'ne')).toBe('बैशाख 2081');
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
