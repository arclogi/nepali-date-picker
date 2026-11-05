import { createRef } from 'react';
import {
  NepaliCalendar,
  NepaliDateInput,
  NepaliDatePicker,
  type NepaliDateValue,
  type TodayButtonPlacement,
} from '@arclogi/nepali-date-picker';
import { toBS } from '@arclogi/nepali-date-picker/core';

const date: NepaliDateValue = toBS('2024-04-13');
const ref = createRef<HTMLInputElement>();

export const input = (
  <NepaliDateInput
    ref={ref}
    value={date}
    minDate={undefined}
    onChange={(next, context) => {
      const ad: Date | undefined = context?.ad;
      const bs: NepaliDateValue | null = next;
      console.log(ad, bs);
    }}
  />
);
const placement: TodayButtonPlacement = 'header';
export const picker = (
  <NepaliDatePicker ref={ref} name="dob" defaultValue={date} todayButtonPlacement={placement} />
);
export const calendar = (
  <NepaliCalendar
    todayButtonPlacement="footer"
    value={date}
    onChange={(next, context) => {
      const ad: Date = context.ad;
      console.log(next.year, ad);
    }}
  />
);

// @ts-expect-error Public dates must use numeric fields.
export const invalid = <NepaliDateInput value="2081-01-01" />;
// @ts-expect-error Today goes in the footer or the header only.
export const invalidPlacement = <NepaliCalendar todayButtonPlacement="top" />;
