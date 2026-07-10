import * as React from 'react';
import { DEFAULT_DATE_FORMAT, DEFAULT_LOCALE } from '../constants';
import {
  createDateChangeContext,
  formatNepaliDate,
  parseNepaliDate,
  toNepaliDateKey,
} from '../date';
import { isDateDisabled } from '../calendar';
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
    | 'autoFocus'
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
  defaultOpen?: boolean | undefined;
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
  onOpenChange?: ((open: boolean) => void) | undefined;
  open?: boolean | undefined;
  popoverClassName?: string | undefined;
  value?: NepaliDateValue | null;
  viewDate?: NepaliMonthValue | undefined;
  weekStartsOn?: WeekdayIndex | undefined;
}

export const NepaliDateInput = React.forwardRef<HTMLInputElement, NepaliDateInputProps>(
  function NepaliDateInput(
    {
      calendarClassName,
      calendarProps,
      className,
      clearable = true,
      closeOnSelect = true,
      defaultOpen = false,
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
      name,
      onBlur,
      onChange,
      onClick,
      onFocus,
      onKeyDown,
      onOpenChange,
      open: openProp,
      placeholder = 'Select date',
      popoverClassName,
      readOnly = true,
      value,
      viewDate,
      weekStartsOn,
      ...inputProps
    },
    forwardedRef,
  ): React.JSX.Element {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const popoverId = `${inputId}-calendar`;
    const rootRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const isControlled = value !== undefined;
    const isOpenControlled = openProp !== undefined;
    const [internalValue, setInternalValue] = React.useState<NepaliDateValue | null>(
      defaultValue ?? null,
    );
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const [openedByKeyboard, setOpenedByKeyboard] = React.useState(false);
    const [draft, setDraft] = React.useState<string | null>(null);
    const [placement, setPlacement] = React.useState<'bottom' | 'top'>('bottom');
    const open = isOpenControlled ? openProp : internalOpen;
    const selectedValue = isControlled ? (value ?? null) : internalValue;
    const displayValue = selectedValue ? formatNepaliDate(selectedValue, format, locale) : '';
    const inputValue = draft ?? displayValue;

    const setInputNode = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    function setOpen(nextOpen: boolean): void {
      if (nextOpen === open) {
        return;
      }

      if (!isOpenControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    }

    React.useEffect(() => {
      if (!open || typeof document === 'undefined') {
        return;
      }

      function handlePointerDown(event: PointerEvent): void {
        const target = event.target;
        if (target instanceof Node && !rootRef.current?.contains(target)) {
          closePopover(false);
        }
      }

      document.addEventListener('pointerdown', handlePointerDown);
      return () => document.removeEventListener('pointerdown', handlePointerDown);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    React.useEffect(() => {
      if (disabled && open) {
        closePopover(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled, open]);

    // Flip the popover above the input when there is not enough room below it.
    React.useLayoutEffect(() => {
      if (!open || typeof window === 'undefined') {
        setPlacement('bottom');
        return;
      }

      const rootRect = rootRef.current?.getBoundingClientRect();
      const popoverHeight = popoverRef.current?.offsetHeight ?? 0;
      if (!rootRect || !popoverHeight) {
        return;
      }

      const spaceBelow = window.innerHeight - rootRect.bottom;
      const spaceAbove = rootRect.top;
      if (spaceBelow < popoverHeight + 16 && spaceAbove > spaceBelow) {
        setPlacement('top');
      }
    }, [open]);

    function updateValue(nextValue: NepaliDateValue | null): void {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onChange?.(nextValue, nextValue ? createDateChangeContext(nextValue, format, locale) : null);
    }

    function openPopover(viaKeyboard: boolean): void {
      setOpenedByKeyboard(viaKeyboard);
      setOpen(true);
    }

    function closePopover(refocusInput: boolean): void {
      setOpen(false);
      setOpenedByKeyboard(false);
      if (refocusInput) {
        inputRef.current?.focus();
      }
    }

    function handleSelect(nextValue: NepaliDateValue): void {
      setDraft(null);
      updateValue(nextValue);

      if (closeOnSelect) {
        closePopover(true);
      }
    }

    function commitDraft(): void {
      if (draft === null) {
        return;
      }

      const text = draft.trim();
      setDraft(null);

      if (!text) {
        updateValue(null);
        return;
      }

      try {
        const parsed = parseNepaliDate(text);
        if (!isDateDisabled(parsed, disabledDates, { max: maxDate, min: minDate })) {
          updateValue(parsed);
        }
      } catch {
        // Unparseable text falls back to the last committed value.
      }
    }

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
      if (!readOnly) {
        setDraft(event.target.value);
      }
    }

    function handleInputClick(event: React.MouseEvent<HTMLInputElement>): void {
      onClick?.(event);
      if (!event.defaultPrevented) {
        openPopover(false);
      }
    }

    function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
      onKeyDown?.(event);

      if (event.defaultPrevented) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        openPopover(true);
        return;
      }

      if (readOnly && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        openPopover(true);
        return;
      }

      if (!readOnly && event.key === 'Enter' && draft !== null) {
        event.preventDefault();
        commitDraft();
        return;
      }

      if (event.key === 'Escape' && draft !== null) {
        event.stopPropagation();
        setDraft(null);
      }
    }

    function handleInputBlur(event: React.FocusEvent<HTMLInputElement>): void {
      onBlur?.(event);
      commitDraft();
    }

    function handleRootKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
      if (event.key === 'Escape' && open) {
        event.stopPropagation();
        closePopover(true);
      }
    }

    function handleRootBlur(event: React.FocusEvent<HTMLDivElement>): void {
      if (
        open &&
        event.relatedTarget instanceof Node &&
        !rootRef.current?.contains(event.relatedTarget)
      ) {
        closePopover(false);
      }
    }

    return (
      <div
        className={cx('ndp-input', className)}
        onBlur={handleRootBlur}
        onKeyDown={handleRootKeyDown}
        ref={rootRef}
      >
        <div className="ndp-input__control">
          <input
            {...inputProps}
            aria-controls={open ? popoverId : undefined}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={cx('ndp-input__field', inputClassName)}
            disabled={disabled}
            id={inputId}
            onBlur={handleInputBlur}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onFocus={onFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            readOnly={readOnly}
            ref={setInputNode}
            role="combobox"
            type="text"
            value={inputValue}
          />
          {clearable && selectedValue ? (
            <button
              aria-label="Clear date"
              className="ndp-input__button"
              disabled={disabled}
              onClick={() => updateValue(null)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="ndp-icon"
                fill="none"
                height="14"
                viewBox="0 0 24 24"
                width="14"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          ) : null}
          <button
            aria-controls={popoverId}
            aria-expanded={open}
            aria-label={open ? 'Close calendar' : 'Open calendar'}
            className={cx('ndp-input__button', 'ndp-input__button--toggle')}
            disabled={disabled}
            onClick={() => (open ? closePopover(true) : openPopover(false))}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="ndp-icon"
              fill="none"
              height="16"
              viewBox="0 0 24 24"
              width="16"
            >
              <rect
                height="16"
                rx="2.4"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.8"
                width="18"
                x="3"
                y="5"
              />
              <path d="M3 9.5h18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
              <path
                d="M8 3v3.4M16 3v3.4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>

        {name ? (
          <input
            name={name}
            type="hidden"
            value={selectedValue ? toNepaliDateKey(selectedValue) : ''}
          />
        ) : null}

        {open ? (
          <div
            aria-label={locale === 'ne' ? 'मिति छान्नुहोस्' : 'Choose date'}
            className={cx('ndp-input__popover', popoverClassName)}
            data-placement={placement}
            id={popoverId}
            ref={popoverRef}
            role="dialog"
          >
            <span aria-hidden="true" className="ndp-input__popover-caret" />
            <NepaliCalendar
              {...calendarProps}
              autoFocus={openedByKeyboard}
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
  },
);

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
