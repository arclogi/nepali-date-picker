import {
  MAX_BS_DATE,
  MIN_BS_DATE,
  getNepaliToday,
  getSupportedAdRange,
  isValidNepaliDate,
  toNepaliDateKey,
} from '../date';
import type { DisabledDateMatcher, NepaliDateValue, NepaliMonthValue } from '../types';
import { describeValue, warnInDevelopment } from './warnings';

const SUPPORTED_RANGE_TEXT = `${toNepaliDateKey(MIN_BS_DATE)} to ${toNepaliDateKey(MAX_BS_DATE)}`;

/**
 * Returns `value` when it is an existing BS date in the supported range. Anything else renders as
 * an empty value instead of throwing during render.
 */
export function toValidDate(
  value: NepaliDateValue | null | undefined,
  propName: string,
): NepaliDateValue | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (isValidNepaliDate(value)) {
    return value;
  }

  warnInDevelopment(
    `Ignoring invalid ${propName} ${describeValue(value)}: expected an existing BS date from ` +
      `${SUPPORTED_RANGE_TEXT}. The field renders empty.`,
  );
  return null;
}

/** Returns a usable month view, or undefined for a malformed one. */
export function toValidView(
  view: NepaliMonthValue | null | undefined,
  propName: string,
): NepaliMonthValue | undefined {
  if (view === null || view === undefined) {
    return undefined;
  }

  // Years outside the supported range stay valid: the calendar clamps them.
  if (Number.isInteger(view.year) && Number.isInteger(view.month)) {
    if (view.month >= 1 && view.month <= 12) {
      return view;
    }
  }

  warnInDevelopment(
    `Ignoring invalid ${propName} ${describeValue(view)}: expected integer year and month 1-12.`,
  );
  return undefined;
}

/** Builds a fast matcher and drops list entries that are not valid BS dates. */
export function toDisabledMatcher(
  disabledDates: DisabledDateMatcher | undefined,
): ((date: NepaliDateValue) => boolean) | undefined {
  if (!disabledDates || typeof disabledDates === 'function') {
    return disabledDates;
  }

  const keys = new Set<string>();
  for (const date of disabledDates) {
    if (isValidNepaliDate(date)) {
      keys.add(toNepaliDateKey(date));
    } else {
      warnInDevelopment(
        `Ignoring invalid disabledDates entry ${describeValue(date)}: expected an existing BS ` +
          `date from ${SUPPORTED_RANGE_TEXT}.`,
      );
    }
  }

  return (date) => keys.has(toNepaliDateKey(date));
}

/**
 * Today's BS date, or null when the device clock is outside the supported range, which would
 * otherwise make the conversion throw during render.
 */
export function getSupportedToday(): NepaliDateValue | null {
  try {
    return getNepaliToday();
  } catch {
    return null;
  }
}

/** The supported endpoint nearest to the device clock, used when today is out of range. */
export function getNearestSupportedDate(): NepaliDateValue {
  return Date.now() < getSupportedAdRange().min.getTime() ? { ...MIN_BS_DATE } : { ...MAX_BS_DATE };
}
