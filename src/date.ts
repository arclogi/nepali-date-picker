import NepaliDateImport, { dateConfigMap } from 'nepali-date-converter';
import { BS_MONTH_KEYS, DEFAULT_DATE_FORMAT, DEFAULT_LOCALE } from './constants';
import type {
  NepaliDateChangeContext,
  NepaliDateRange,
  NepaliDateValue,
  NepaliLocale,
} from './types';

type NepaliDateConstructor = typeof NepaliDateImport;
type NepaliDateInstance = InstanceType<NepaliDateConstructor>;
type DateConfig = Record<string, Record<(typeof BS_MONTH_KEYS)[number], number>>;

const NepaliDate = (
  typeof NepaliDateImport === 'function'
    ? NepaliDateImport
    : (NepaliDateImport as unknown as { default: NepaliDateConstructor }).default
) as NepaliDateConstructor;

const bsDateConfig = dateConfigMap as DateConfig;
const DEVANAGARI_ZERO_CODE_POINT = '०'.charCodeAt(0);
const supportedYears = Object.keys(bsDateConfig)
  .map(Number)
  .sort((a, b) => a - b);

const minSupportedYear = supportedYears[0] ?? 2000;
const maxSupportedYear = supportedYears.at(-1) ?? 2090;

export const SUPPORTED_BS_YEAR_RANGE = {
  max: maxSupportedYear,
  min: minSupportedYear,
} as const;

export const MIN_BS_DATE: NepaliDateValue = {
  day: 1,
  month: 1,
  year: minSupportedYear,
};

export const MAX_BS_DATE: NepaliDateValue = {
  day: getDaysInNepaliMonth(maxSupportedYear, 12),
  month: 12,
  year: maxSupportedYear,
};

let supportedAdTimeRange: { max: number; min: number } | undefined;

function getSupportedAdTimeRange(): { max: number; min: number } {
  supportedAdTimeRange ??= {
    max: toAD(MAX_BS_DATE).getTime(),
    min: toAD(MIN_BS_DATE).getTime(),
  };

  return supportedAdTimeRange;
}

export function getSupportedAdRange(): { max: Date; min: Date } {
  const range = getSupportedAdTimeRange();
  return {
    max: new Date(range.max),
    min: new Date(range.min),
  };
}

export function getDaysInNepaliMonth(year: number, month: number): number {
  assertInteger(year, 'year');
  assertInteger(month, 'month');

  const yearConfig = bsDateConfig[String(year)];
  if (!yearConfig) {
    throw new RangeError(
      `BS year ${year} is outside the supported range ${minSupportedYear}-${maxSupportedYear}.`,
    );
  }

  const monthKey = BS_MONTH_KEYS[month - 1];
  if (!monthKey) {
    throw new RangeError('BS month must be between 1 and 12.');
  }

  return yearConfig[monthKey];
}

export function assertValidNepaliDate(date: NepaliDateValue): void {
  assertInteger(date.year, 'year');
  assertInteger(date.month, 'month');
  assertInteger(date.day, 'day');

  const daysInMonth = getDaysInNepaliMonth(date.year, date.month);
  if (date.day < 1 || date.day > daysInMonth) {
    throw new RangeError(
      `BS day must be between 1 and ${daysInMonth} for ${date.year}-${pad2(date.month)}.`,
    );
  }
}

export function isValidNepaliDate(date: NepaliDateValue): boolean {
  try {
    assertValidNepaliDate(date);
    return true;
  } catch {
    return false;
  }
}

export function parseNepaliDate(value: string): NepaliDateValue {
  const normalizedValue = normalizeDevanagariDigits(value.trim());
  const match = normalizedValue.match(/^(\d{4})([-/\s])(\d{1,2})\2(\d{1,2})$/);
  if (!match) {
    throw new Error('Expected a BS date string in YYYY-MM-DD format.');
  }

  const date = {
    day: Number(match[4]),
    month: Number(match[3]),
    year: Number(match[1]),
  };

  assertValidNepaliDate(date);
  return date;
}

export function toNepaliDateKey(date: NepaliDateValue): string {
  assertValidNepaliDate(date);
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
}

export function formatNepaliDate(
  date: NepaliDateValue,
  format = DEFAULT_DATE_FORMAT,
  locale: NepaliLocale = DEFAULT_LOCALE,
): string {
  assertValidNepaliDate(date);
  return createNepaliDate(date).format(format, toConverterLocale(locale));
}

export function toAD(date: NepaliDateValue): Date {
  assertValidNepaliDate(date);
  const ad = createNepaliDate(date).getAD();
  return new Date(ad.year, ad.month, ad.date, 12, 0, 0, 0);
}

export function toBS(date: Date | number | string): NepaliDateValue {
  const jsDate = normalizeAdInput(date);
  const range = getSupportedAdTimeRange();
  const time = jsDate.getTime();

  if (time < range.min || time > range.max) {
    throw new RangeError(
      `AD date ${toIsoDay(jsDate)} is outside the supported BS range ` +
        `${minSupportedYear}-01-01 to ${maxSupportedYear}-12-30.`,
    );
  }

  const nepaliDate = new NepaliDate(jsDate);

  return {
    day: nepaliDate.getDate(),
    month: nepaliDate.getMonth() + 1,
    year: nepaliDate.getYear(),
  };
}

export function getNepaliToday(timeZone?: string): NepaliDateValue {
  if (!timeZone) {
    return toBS(new Date());
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(new Date());
  const partValue = (type: 'day' | 'month' | 'year'): number =>
    Number(parts.find((part) => part.type === type)?.value);

  return toBS(new Date(partValue('year'), partValue('month') - 1, partValue('day'), 12, 0, 0, 0));
}

export function compareNepaliDates(left: NepaliDateValue, right: NepaliDateValue): number {
  assertValidNepaliDate(left);
  assertValidNepaliDate(right);
  return toSortableDateNumber(left) - toSortableDateNumber(right);
}

export function isSameNepaliDate(left: NepaliDateValue, right: NepaliDateValue): boolean {
  return compareNepaliDates(left, right) === 0;
}

export function isNepaliDateBefore(left: NepaliDateValue, right: NepaliDateValue): boolean {
  return compareNepaliDates(left, right) < 0;
}

export function isNepaliDateAfter(left: NepaliDateValue, right: NepaliDateValue): boolean {
  return compareNepaliDates(left, right) > 0;
}

export function clampNepaliDate(
  date: NepaliDateValue,
  range: NepaliDateRange = {},
): NepaliDateValue {
  assertValidNepaliDate(date);

  const min = range.min ?? MIN_BS_DATE;
  const max = range.max ?? MAX_BS_DATE;

  if (compareNepaliDates(date, min) < 0) {
    return { ...min };
  }

  if (compareNepaliDates(date, max) > 0) {
    return { ...max };
  }

  return date;
}

export function addNepaliMonths(date: NepaliDateValue, amount: number): NepaliDateValue {
  assertValidNepaliDate(date);
  assertInteger(amount, 'amount');

  const zeroBasedMonth = date.month - 1;
  const totalMonths = date.year * 12 + zeroBasedMonth + amount;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = positiveModulo(totalMonths, 12) + 1;
  const nextDay = Math.min(date.day, getDaysInNepaliMonth(nextYear, nextMonth));

  return {
    day: nextDay,
    month: nextMonth,
    year: nextYear,
  };
}

export function addNepaliDays(date: NepaliDateValue, amount: number): NepaliDateValue {
  assertValidNepaliDate(date);
  assertInteger(amount, 'amount');

  const ad = toAD(date);
  return toBS(new Date(ad.getFullYear(), ad.getMonth(), ad.getDate() + amount, 12, 0, 0, 0));
}

export function startOfNepaliMonth(date: NepaliDateValue): NepaliDateValue {
  assertValidNepaliDate(date);
  return {
    day: 1,
    month: date.month,
    year: date.year,
  };
}

export function endOfNepaliMonth(date: NepaliDateValue): NepaliDateValue {
  assertValidNepaliDate(date);
  return {
    day: getDaysInNepaliMonth(date.year, date.month),
    month: date.month,
    year: date.year,
  };
}

export function createDateChangeContext(
  date: NepaliDateValue,
  format = DEFAULT_DATE_FORMAT,
  locale: NepaliLocale = DEFAULT_LOCALE,
): NepaliDateChangeContext {
  assertValidNepaliDate(date);
  return {
    ad: toAD(date),
    bs: { ...date },
    formatted: formatNepaliDate(date, format, locale),
  };
}

function createNepaliDate(date: NepaliDateValue): NepaliDateInstance {
  return new NepaliDate(date.year, date.month - 1, date.day);
}

function normalizeAdInput(value: Date | number | string): Date {
  if (value instanceof Date) {
    return normalizeDateObject(value);
  }

  if (typeof value === 'number') {
    return normalizeDateObject(new Date(value));
  }

  const isoDateOnly = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDateOnly) {
    const year = Number(isoDateOnly[1]);
    const month = Number(isoDateOnly[2]);
    const day = Number(isoDateOnly[3]);
    return normalizeDateObject(new Date(year, month - 1, day, 12, 0, 0, 0));
  }

  return normalizeDateObject(new Date(value));
}

function normalizeDevanagariDigits(value: string): string {
  return value.replace(/[०-९]/g, (digit) =>
    String(digit.charCodeAt(0) - DEVANAGARI_ZERO_CODE_POINT),
  );
}

function normalizeDateObject(date: Date): Date {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Expected a valid AD Date, timestamp, or YYYY-MM-DD string.');
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function toConverterLocale(locale: NepaliLocale): 'en' | 'np' {
  return locale === 'ne' ? 'np' : 'en';
}

function toIsoDay(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function assertInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(`BS ${fieldName} must be an integer.`);
  }
}

function toSortableDateNumber(date: NepaliDateValue): number {
  return date.year * 10_000 + date.month * 100 + date.day;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
