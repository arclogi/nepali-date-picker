import {
  compareNepaliDates,
  isValidNepaliDate,
  MAX_BS_DATE,
  MIN_BS_DATE,
  toNepaliDateKey,
} from '../date';
import type { NepaliDateValue } from '../types';
import { describeValue, warnInDevelopment } from './warnings';

export interface CalendarBounds {
  /** True when minDate is after maxDate: no date can be selected. */
  empty: boolean;
  max: NepaliDateValue;
  min: NepaliDateValue;
}

export function getCalendarBounds(
  minDate?: NepaliDateValue | null,
  maxDate?: NepaliDateValue | null,
): CalendarBounds {
  const min = toBound(minDate, MIN_BS_DATE, 'minDate');
  const max = toBound(maxDate, MAX_BS_DATE, 'maxDate');

  if (compareNepaliDates(min, max) > 0) {
    warnInDevelopment(
      `minDate ${toNepaliDateKey(min)} is after maxDate ${toNepaliDateKey(max)}, ` +
        'so no date can be selected.',
    );
    // Keep navigation on the minDate month; callers disable every day.
    return { empty: true, max: min, min };
  }

  return { empty: false, max, min };
}

function toBound(
  date: NepaliDateValue | null | undefined,
  fallback: NepaliDateValue,
  propName: string,
): NepaliDateValue {
  if (date === null || date === undefined) {
    return fallback;
  }

  // Bounds outside the supported years are clipped to the supported endpoints.
  if (date.year < MIN_BS_DATE.year) return MIN_BS_DATE;
  if (date.year > MAX_BS_DATE.year) return MAX_BS_DATE;
  if (isValidNepaliDate(date)) return date;

  warnInDevelopment(
    `Ignoring invalid ${propName} ${describeValue(date)}: expected an existing BS date.`,
  );
  return fallback;
}
