import {
  BS_MONTHS_EN,
  BS_MONTHS_NE,
  DEFAULT_LOCALE,
  DEFAULT_WEEK_STARTS_ON,
  WEEKDAYS_EN_LONG,
  WEEKDAYS_EN_SHORT,
  WEEKDAYS_NE_LONG,
  WEEKDAYS_NE_SHORT,
} from './constants';
import {
  addNepaliDays,
  assertValidNepaliDate,
  compareNepaliDates,
  getDaysInNepaliMonth,
  getNepaliToday,
  isSameNepaliDate,
  toAD,
  toNepaliDateKey,
} from './date';
import type {
  DisabledDateMatcher,
  NepaliCalendarDay,
  NepaliDateRange,
  NepaliDateValue,
  NepaliLocale,
  NepaliMonthGridOptions,
  WeekdayIndex,
} from './types';

export function getNepaliMonthGrid(options: NepaliMonthGridOptions): NepaliCalendarDay[] {
  const weekStartsOn = options.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON;
  const fixedWeeks = options.fixedWeeks ?? true;
  const firstDayOfMonth = {
    day: 1,
    month: options.month,
    year: options.year,
  };

  assertValidNepaliDate(firstDayOfMonth);

  const firstWeekday = toAD(firstDayOfMonth).getDay() as WeekdayIndex;
  const leadingDays = (firstWeekday - weekStartsOn + 7) % 7;
  const startDate = addNepaliDays(firstDayOfMonth, -leadingDays);
  const daysInMonth = getDaysInNepaliMonth(options.year, options.month);
  const cells = fixedWeeks ? 42 : Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const today = getNepaliToday();

  return Array.from({ length: cells }, (_, index) => {
    const date = addNepaliDays(startDate, index);
    const adDate = toAD(date);

    return {
      adDate,
      date,
      isToday: isSameNepaliDate(date, today),
      key: toNepaliDateKey(date),
      outsideMonth: date.year !== options.year || date.month !== options.month,
      weekday: adDate.getDay() as WeekdayIndex,
    };
  });
}

export function getNepaliMonthLabel(
  date: Pick<NepaliDateValue, 'month' | 'year'>,
  locale: NepaliLocale = DEFAULT_LOCALE,
): string {
  const monthName = locale === 'ne' ? BS_MONTHS_NE[date.month - 1] : BS_MONTHS_EN[date.month - 1];
  if (!monthName) {
    throw new RangeError('BS month must be between 1 and 12.');
  }

  return `${monthName} ${date.year}`;
}

export function getWeekdayLabels(
  locale: NepaliLocale = DEFAULT_LOCALE,
  width: 'long' | 'short' = 'short',
  weekStartsOn: WeekdayIndex = DEFAULT_WEEK_STARTS_ON,
): string[] {
  const labels =
    locale === 'ne'
      ? width === 'long'
        ? WEEKDAYS_NE_LONG
        : WEEKDAYS_NE_SHORT
      : width === 'long'
        ? WEEKDAYS_EN_LONG
        : WEEKDAYS_EN_SHORT;

  return Array.from({ length: 7 }, (_, index) => labels[(weekStartsOn + index) % 7]!);
}

export function isDateDisabled(
  date: NepaliDateValue,
  matcher?: DisabledDateMatcher,
  range: NepaliDateRange = {},
): boolean {
  assertValidNepaliDate(date);

  if (range.min && compareNepaliDates(date, range.min) < 0) {
    return true;
  }

  if (range.max && compareNepaliDates(date, range.max) > 0) {
    return true;
  }

  if (!matcher) {
    return false;
  }

  if (typeof matcher === 'function') {
    return matcher(date);
  }

  return matcher.some((disabledDate) => isSameNepaliDate(disabledDate, date));
}
