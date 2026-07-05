import * as React from 'react';
import { NepaliDateInput, type NepaliDateInputProps } from './NepaliDateInput';

export type NepaliDatePickerProps = NepaliDateInputProps;

export const NepaliDatePicker = React.forwardRef<HTMLInputElement, NepaliDatePickerProps>(
  function NepaliDatePicker(props, ref): React.JSX.Element {
    return <NepaliDateInput {...props} ref={ref} />;
  },
);
