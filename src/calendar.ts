import {
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
  formatNepaliDate,
  getDaysInNepaliMonth,
  getNepaliToday,
  getSupportedAdRange,
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

const DAY_MS = 86_400_000;

export function getNepaliMonthGrid(options: NepaliMonthGridOptions): NepaliCalendarDay[] {
  const weekStartsOn = options.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON;
  const fixedWeeks = options.fixedWeeks ?? true;
  const firstDayOfMonth = {
    day: 1,
    month: options.month,
    year: options.year,
  };

  assertValidNepaliDate(firstDayOfMonth);

  const firstDayAd = toAD(firstDayOfMonth);
  const firstWeekday = firstDayAd.getDay() as WeekdayIndex;
  const leadingDays = (firstWeekday - weekStartsOn + 7) % 7;
  const daysInMonth = getDaysInNepaliMonth(options.year, options.month);
  const cells = fixedWeeks ? 42 : Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  // The supported BS range does not extend before MIN_BS_DATE or past MAX_BS_DATE,
  // so grids for the boundary months clamp their outside-month cells instead of throwing.
  const supportedAdRange = getSupportedAdRange();
  const daysBeforeStart = Math.round(
    (firstDayAd.getTime() - supportedAdRange.min.getTime()) / DAY_MS,
  );
  const daysUntilEnd = Math.round((supportedAdRange.max.getTime() - firstDayAd.getTime()) / DAY_MS);
  const startOffset = -Math.min(leadingDays, daysBeforeStart);
  const endOffset = Math.min(cells - leadingDays - 1, daysUntilEnd);
  const today = getNepaliToday();

  return Array.from({ length: endOffset - startOffset + 1 }, (_, index) => {
    const date = addNepaliDays(firstDayOfMonth, startOffset + index);
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
  return formatNepaliDate({ day: 1, month: date.month, year: date.year }, 'MMMM YYYY', locale);
}

export function getNepaliMonthNames(locale: NepaliLocale = DEFAULT_LOCALE): string[] {
  return Array.from({ length: 12 }, (_, index) =>
    formatNepaliDate({ day: 1, month: index + 1, year: 2081 }, 'MMMM', locale),
  );
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
