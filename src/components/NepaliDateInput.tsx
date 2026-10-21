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
import { getCalendarBounds } from './bounds';
import { toDisabledMatcher, toValidDate } from './sanitize';

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
      placeholder = locale === 'ne' ? 'मिति छान्नुहोस्' : 'Select date',
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
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    // Safari (and Firefox on macOS) does not focus a clicked button, so pressing a day can blur
    // the input with no related target. A press that starts inside the component keeps the
    // popover open until it ends in a click, a focus change inside, a cancel, or a release
    // outside. A release inside does not end it, because iOS fires the focus-changing mousedown
    // only after pointerup.
    const pointerDownInsideRef = React.useRef(false);
    const isControlled = value !== undefined;
    const isOpenControlled = openProp !== undefined;
    const [internalValue, setInternalValue] = React.useState<NepaliDateValue | null>(
      defaultValue ?? null,
    );
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const [openedByKeyboard, setOpenedByKeyboard] = React.useState(false);
    const [draft, setDraft] = React.useState<string | null>(null);
    const [placement, setPlacement] = React.useState<'bottom' | 'top'>('bottom');
    const requestedOpen = isOpenControlled ? openProp : internalOpen;
    const open = !disabled && requestedOpen;
    const rawValue = isControlled ? (value ?? null) : internalValue;
    // Invalid or out-of-range values render empty (and marked invalid) instead of throwing.
    const selectedValue = toValidDate(rawValue, isControlled ? 'value' : 'defaultValue');
    const valueIsInvalid = rawValue !== null && selectedValue === null;
    const displayValue = selectedValue ? formatNepaliDate(selectedValue, format, locale) : '';
    const inputValue = draft ?? displayValue;
    const bounds = getCalendarBounds(minDate, maxDate);
    const disabledMatcher = React.useMemo(() => toDisabledMatcher(disabledDates), [disabledDates]);

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

    const setOpen = React.useCallback(
      (nextOpen: boolean): void => {
        if (nextOpen === requestedOpen) {
          return;
        }

        if (!isOpenControlled) {
          setInternalOpen(nextOpen);
        }
        onOpenChange?.(nextOpen);
      },
      [isOpenControlled, onOpenChange, requestedOpen],
    );

    const closePopover = React.useCallback(
      (refocusInput: boolean): void => {
        setOpen(false);
        setOpenedByKeyboard(false);
        if (refocusInput) {
          inputRef.current?.focus();
        }
      },
      [setOpen],
    );

    React.useEffect(() => {
      if (!open) {
        return;
      }

      function handlePointerDown(event: PointerEvent): void {
        const target = event.target;
        if (target instanceof Node && !rootRef.current?.contains(target)) {
          pointerDownInsideRef.current = false;
          closePopover(false);
        }
      }

      document.addEventListener('pointerdown', handlePointerDown);
      return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [closePopover, open]);

    // A press that started inside but was released outside gets no click inside, so end it here.
    React.useEffect(() => {
      function handlePointerUp(event: PointerEvent): void {
        if (!pointerDownInsideRef.current) {
          return;
        }

        const target = event.target;
        if (!(target instanceof Node) || !rootRef.current?.contains(target)) {
          pointerDownInsideRef.current = false;
        }
      }

      document.addEventListener('pointerup', handlePointerUp, true);
      return () => document.removeEventListener('pointerup', handlePointerUp, true);
    }, []);

    React.useEffect(() => {
      if (disabled && requestedOpen) {
        closePopover(false);
      }
    }, [closePopover, disabled, requestedOpen]);

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
      setPlacement(spaceBelow < popoverHeight + 16 && spaceAbove > spaceBelow ? 'top' : 'bottom');
    }, [open]);

    function updateValue(
      nextValue: NepaliDateValue | null,
      context?: NepaliDateChangeContext,
    ): void {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onChange?.(
        nextValue,
        context ?? (nextValue ? createDateChangeContext(nextValue, format, locale) : null),
      );
    }

    function openPopover(viaKeyboard: boolean): void {
      setOpenedByKeyboard(viaKeyboard);
      setOpen(true);
    }

    function handleSelect(nextValue: NepaliDateValue, context: NepaliDateChangeContext): void {
      setDraft(null);
      updateValue(nextValue, context);

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

      let parsed: NepaliDateValue;
      try {
        parsed = parseNepaliDate(text);
      } catch {
        // Unparseable text falls back to the last committed value.
        return;
      }
      if (
        !bounds.empty &&
        !isDateDisabled(parsed, disabledMatcher, { max: bounds.max, min: bounds.min })
      ) {
        updateValue(parsed);
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
      const nextFocus = event.relatedTarget;
      if (!open || (nextFocus instanceof Node && rootRef.current?.contains(nextFocus))) {
        return;
      }

      // Safari: a press inside the component that did not move focus to a focusable element.
      if (nextFocus === null && pointerDownInsideRef.current) {
        return;
      }

      closePopover(false);
    }

    function handleRootPointerDown(): void {
      pointerDownInsideRef.current = true;
    }

    function endPointerPress(): void {
      pointerDownInsideRef.current = false;
    }

    return (
      <div
        className={cx('ndp-input', className)}
        data-disabled={disabled || undefined}
        data-invalid={valueIsInvalid ? true : inputProps['aria-invalid'] || undefined}
        onBlur={handleRootBlur}
        onClick={endPointerPress}
        onFocus={endPointerPress}
        onKeyDown={handleRootKeyDown}
        onPointerCancel={endPointerPress}
        onPointerDown={handleRootPointerDown}
        ref={rootRef}
      >
        <div className="ndp-input__control">
          <input
            {...inputProps}
            aria-controls={open ? popoverId : undefined}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-invalid={inputProps['aria-invalid'] ?? (valueIsInvalid || undefined)}
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
          {/* An invalid value can be cleared too, but only by an explicit press. */}
          {clearable && (selectedValue || valueIsInvalid) ? (
            <button
              aria-label={locale === 'ne' ? 'मिति हटाउनुहोस्' : 'Clear date'}
              className="ndp-input__button"
              disabled={disabled}
              onClick={() => {
                setDraft(null);
                updateValue(null);
                inputRef.current?.focus();
              }}
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
            aria-controls={open ? popoverId : undefined}
            aria-expanded={open}
            aria-label={
              locale === 'ne'
                ? open
                  ? 'पात्रो बन्द गर्नुहोस्'
                  : 'पात्रो खोल्नुहोस्'
                : open
                  ? 'Close calendar'
                  : 'Open calendar'
            }
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
            disabled={disabled}
            form={inputProps.form}
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
            // Focusable as a press target, so Safari moves focus here instead of to <body>.
            tabIndex={-1}
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
