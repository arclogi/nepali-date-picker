import * as React from 'react';
import { DEFAULT_DATE_FORMAT, DEFAULT_LOCALE } from '../constants';
import { createDateChangeContext, formatNepaliDate } from '../date';
import type {
  DisabledDateMatcher,
  NepaliDateChangeContext,
  NepaliDateValue,
  NepaliLocale,
  NepaliMonthValue,
  WeekdayIndex,
} from '../types';
import { NepaliCalendar, type NepaliCalendarProps } from './NepaliCalendar';

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'defaultValue' | 'max' | 'min' | 'onChange' | 'type' | 'value'
>;

export interface NepaliDateInputProps extends NativeInputProps {
  calendarClassName?: string | undefined;
  calendarProps?: Omit<
    NepaliCalendarProps,
    | 'className'
    | 'defaultViewDate'
    | 'disabledDates'
    | 'format'
    | 'locale'
    | 'maxDate'
    | 'minDate'
    | 'onChange'
    | 'value'
    | 'viewDate'
    | 'weekStartsOn'
  >;
  clearable?: boolean | undefined;
  closeOnSelect?: boolean | undefined;
  defaultValue?: NepaliDateValue | undefined;
  defaultViewDate?: NepaliMonthValue | undefined;
  disabledDates?: DisabledDateMatcher | undefined;
  format?: string | undefined;
  inputClassName?: string | undefined;
  locale?: NepaliLocale | undefined;
  maxDate?: NepaliDateValue | undefined;
  minDate?: NepaliDateValue | undefined;
  onChange?:
    ((date: NepaliDateValue | null, context: NepaliDateChangeContext | null) => void) | undefined;
  popoverClassName?: string | undefined;
  value?: NepaliDateValue | null;
  viewDate?: NepaliMonthValue | undefined;
  weekStartsOn?: WeekdayIndex | undefined;
}

export function NepaliDateInput({
  calendarClassName,
  calendarProps,
  className,
  clearable = true,
  closeOnSelect = true,
  defaultValue,
  defaultViewDate,
  disabled,
  disabledDates,
  format = DEFAULT_DATE_FORMAT,
  id,
  inputClassName,
  locale = DEFAULT_LOCALE,
  maxDate,
  minDate,
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  placeholder = 'Select date',
  popoverClassName,
  readOnly = true,
  value,
  viewDate,
  weekStartsOn,
  ...inputProps
}: NepaliDateInputProps): React.JSX.Element {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<NepaliDateValue | null>(
    defaultValue ?? null,
  );
  const [open, setOpen] = React.useState(false);
  const selectedValue = isControlled ? (value ?? null) : internalValue;
  const displayValue = selectedValue ? formatNepaliDate(selectedValue, format, locale) : '';

  React.useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  function updateValue(nextValue: NepaliDateValue | null): void {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue, nextValue ? createDateChangeContext(nextValue, format, locale) : null);
  }

  function handleSelect(nextValue: NepaliDateValue): void {
    updateValue(nextValue);

    if (closeOnSelect) {
      setOpen(false);
    }
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    onKeyDown?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className={cx('ndp-input', className)} ref={rootRef}>
      <div className="ndp-input__control">
        <input
          {...inputProps}
          aria-expanded={open}
          aria-haspopup="grid"
          className={cx('ndp-input__field', inputClassName)}
          disabled={disabled}
          id={inputId}
          onBlur={onBlur}
          onClick={() => setOpen(true)}
          onFocus={(event) => {
            onFocus?.(event);
            setOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          readOnly={readOnly}
          type="text"
          value={displayValue}
        />
        {clearable && selectedValue ? (
          <button
            aria-label="Clear date"
            className="ndp-input__button"
            disabled={disabled}
            onClick={() => updateValue(null)}
            type="button"
          >
            x
          </button>
        ) : null}
        <button
          aria-controls={`${inputId}-calendar`}
          aria-label={open ? 'Close calendar' : 'Open calendar'}
          className="ndp-input__button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          v
        </button>
      </div>

      {open ? (
        <div
          className={cx('ndp-input__popover', popoverClassName)}
          id={`${inputId}-calendar`}
          role="dialog"
        >
          <NepaliCalendar
            {...calendarProps}
            className={calendarClassName}
            defaultViewDate={defaultViewDate}
            disabledDates={disabledDates}
            format={format}
            locale={locale}
            maxDate={maxDate}
            minDate={minDate}
            onChange={handleSelect}
            value={selectedValue}
            viewDate={viewDate}
            weekStartsOn={weekStartsOn}
          />
        </div>
      ) : null}
    </div>
  );
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
