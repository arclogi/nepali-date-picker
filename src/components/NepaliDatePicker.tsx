import type { JSX } from 'react';
import { NepaliDateInput, type NepaliDateInputProps } from './NepaliDateInput';

export type NepaliDatePickerProps = NepaliDateInputProps;

export function NepaliDatePicker(props: NepaliDatePickerProps): JSX.Element {
  return <NepaliDateInput {...props} />;
}
