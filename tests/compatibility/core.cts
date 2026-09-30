import { toAD, toBS, type NepaliDateValue } from '@arclogi/nepali-date-picker/core';
import { NepaliDatePicker } from '@arclogi/nepali-date-picker';

const bs: NepaliDateValue = toBS('2024-04-13');
const ad: Date = toAD(bs);
export { ad, bs, NepaliDatePicker };
