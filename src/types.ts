export type NepaliLocale = 'en' | 'ne';

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface NepaliDateValue {
  year: number;
  month: number;
  day: number;
}

export interface NepaliMonthValue {
  year: number;
  month: number;
}

export interface NepaliDateRange {
  min?: NepaliDateValue | undefined;
  max?: NepaliDateValue | undefined;
}

export interface NepaliDateChangeContext {
  ad: Date;
  bs: NepaliDateValue;
  formatted: string;
}

export type DisabledDateMatcher = readonly NepaliDateValue[] | ((date: NepaliDateValue) => boolean);

export interface NepaliCalendarDay {
  adDate: Date;
  date: NepaliDateValue;
  isToday: boolean;
  key: string;
  outsideMonth: boolean;
  weekday: WeekdayIndex;
}

export interface NepaliMonthGridOptions {
  fixedWeeks?: boolean | undefined;
  month: number;
  weekStartsOn?: WeekdayIndex | undefined;
  year: number;
}
