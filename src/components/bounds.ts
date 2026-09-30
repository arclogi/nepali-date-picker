import { compareNepaliDates, MAX_BS_DATE, MIN_BS_DATE } from '../date';
import type { NepaliDateValue } from '../types';

export function getCalendarBounds(minDate = MIN_BS_DATE, maxDate = MAX_BS_DATE) {
  const min = clampBound(minDate);
  const max = clampBound(maxDate);
  if (compareNepaliDates(min, max) > 0) {
    throw new RangeError('minDate must be on or before maxDate.');
  }
  return { min, max };
}

function clampBound(date: NepaliDateValue): NepaliDateValue {
  if (date.year < MIN_BS_DATE.year) return MIN_BS_DATE;
  if (date.year > MAX_BS_DATE.year) return MAX_BS_DATE;
  return date;
}
