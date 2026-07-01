import * as React from 'react';
import { DEFAULT_DATE_FORMAT, DEFAULT_LOCALE, DEFAULT_WEEK_STARTS_ON } from '../constants';
import {
  addNepaliDays,
  addNepaliMonths,
  createDateChangeContext,
  formatNepaliDate,
  getNepaliToday,
  isSameNepaliDate,
} from '../date';
import {
  getNepaliMonthGrid,
  getNepaliMonthLabel,
  getWeekdayLabels,
  isDateDisabled,
} from '../calendar';
import type {
  DisabledDateMatcher,
  NepaliDateChangeContext,
  NepaliDateValue,
  NepaliLocale,
  NepaliMonthValue,
  WeekdayIndex,
} from '../types';

export interface NepaliCalendarProps {
  ariaLabel?: string | undefined;
  className?: string | undefined;
  defaultViewDate?: NepaliMonthValue | undefined;
  disabledDates?: DisabledDateMatcher | undefined;
  fixedWeeks?: boolean | undefined;
  format?: string | undefined;
  locale?: NepaliLocale | undefined;
  maxDate?: NepaliDateValue | undefined;
  minDate?: NepaliDateValue | undefined;
  onChange?: ((date: NepaliDateValue, context: NepaliDateChangeContext) => void) | undefined;
  onViewDateChange?: ((date: NepaliMonthValue) => void) | undefined;
  value?: NepaliDateValue | null;
  viewDate?: NepaliMonthValue | undefined;
  weekStartsOn?: WeekdayIndex | undefined;
}

export function NepaliCalendar({
  ariaLabel,
  className,
  defaultViewDate,
  disabledDates,
  fixedWeeks = true,
  format = DEFAULT_DATE_FORMAT,
  locale = DEFAULT_LOCALE,
  maxDate,
  minDate,
  onChange,
  onViewDateChange,
  value,
  viewDate,
  weekStartsOn = DEFAULT_WEEK_STARTS_ON,
}: NepaliCalendarProps): React.JSX.Element {
  const today = React.useMemo(() => getNepaliToday(), []);
  const initialView = React.useMemo(
    () => toMonthValue(value ?? defaultViewDate ?? today),
    [defaultViewDate, today, value],
  );
  const [internalView, setInternalView] = React.useState<NepaliMonthValue>(initialView);
  const [focusedDate, setFocusedDate] = React.useState<NepaliDateValue>(value ?? today);
  const dayRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const currentView = viewDate ?? internalView;
  const monthLabel = getNepaliMonthLabel(currentView, locale);
  const weekdayLabels = getWeekdayLabels(locale, 'short', weekStartsOn);
  const calendarDays = getNepaliMonthGrid({
    fixedWeeks,
    month: currentView.month,
    weekStartsOn,
    year: currentView.year,
  });

  function setView(nextView: NepaliMonthValue): void {
    if (!viewDate) {
      setInternalView(nextView);
    }
    onViewDateChange?.(nextView);
  }

  function moveView(amount: number): void {
    setView(toMonthValue(addNepaliMonths({ ...currentView, day: 1 }, amount)));
  }

  function selectDate(date: NepaliDateValue): void {
    if (isDateUnavailable(date)) {
      return;
    }

    onChange?.(date, createDateChangeContext(date, format, locale));
  }

  function moveFocus(date: NepaliDateValue): void {
    setFocusedDate(date);
    setView(toMonthValue(date));

    const key = formatNepaliDate(date);
    requestAnimationFrame(() => {
      dayRefs.current.get(key)?.focus();
    });
  }

  function handleDayKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    date: NepaliDateValue,
  ): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(addNepaliDays(date, 7));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(addNepaliDays(date, -1));
        break;
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(addNepaliDays(date, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(addNepaliDays(date, -7));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectDate(date);
        break;
      case 'PageDown':
        event.preventDefault();
        moveFocus(addNepaliMonths(date, 1));
        break;
      case 'PageUp':
        event.preventDefault();
        moveFocus(addNepaliMonths(date, -1));
        break;
    }
  }

  function isDateUnavailable(date: NepaliDateValue): boolean {
    return isDateDisabled(date, disabledDates, { max: maxDate, min: minDate });
  }

  return (
    <div className={cx('ndp-calendar', className)}>
      <div className="ndp-calendar__header">
        <button
          aria-label="Previous month"
          className="ndp-icon-button"
          onClick={() => moveView(-1)}
          type="button"
        >
          <span aria-hidden="true">&lt;</span>
        </button>
        <div aria-live="polite" className="ndp-calendar__heading">
          {monthLabel}
        </div>
        <button
          aria-label="Next month"
          className="ndp-icon-button"
          onClick={() => moveView(1)}
          type="button"
        >
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>

      <div className="ndp-calendar__weekdays" role="row">
        {weekdayLabels.map((weekday) => (
          <div className="ndp-calendar__weekday" key={weekday} role="columnheader">
            {weekday}
          </div>
        ))}
      </div>

      <div
        aria-label={ariaLabel ?? `Calendar for ${monthLabel}`}
        className="ndp-calendar__grid"
        role="grid"
      >
        {calendarDays.map((calendarDay) => {
          const selected = value ? isSameNepaliDate(calendarDay.date, value) : false;
          const focused = isSameNepaliDate(calendarDay.date, focusedDate);
          const unavailable = isDateUnavailable(calendarDay.date);
          const label = formatNepaliDate(calendarDay.date, 'ddd, DD MMMM YYYY', locale);

          return (
            <button
              aria-disabled={unavailable}
              aria-label={label}
              aria-selected={selected}
              className="ndp-calendar__day"
              data-outside-month={calendarDay.outsideMonth}
              data-today={calendarDay.isToday}
              disabled={unavailable}
              key={calendarDay.key}
              onClick={() => selectDate(calendarDay.date)}
              onKeyDown={(event) => handleDayKeyDown(event, calendarDay.date)}
              ref={(node) => {
                if (node) {
                  dayRefs.current.set(calendarDay.key, node);
                } else {
                  dayRefs.current.delete(calendarDay.key);
                }
              }}
              role="gridcell"
              tabIndex={focused ? 0 : -1}
              type="button"
            >
              {formatNepaliDate(calendarDay.date, 'D', locale)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function toMonthValue(date: NepaliDateValue | NepaliMonthValue): NepaliMonthValue {
  return {
    month: date.month,
    year: date.year,
  };
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
