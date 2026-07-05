import * as React from 'react';
import { DEFAULT_DATE_FORMAT, DEFAULT_LOCALE, DEFAULT_WEEK_STARTS_ON } from '../constants';
import {
  MAX_BS_DATE,
  MIN_BS_DATE,
  addNepaliDays,
  addNepaliMonths,
  clampNepaliDate,
  compareNepaliDates,
  createDateChangeContext,
  formatNepaliDate,
  getNepaliToday,
  isSameNepaliDate,
  toNepaliDateKey,
} from '../date';
import {
  getNepaliMonthGrid,
  getNepaliMonthLabel,
  getNepaliMonthNames,
  getWeekdayLabels,
  isDateDisabled,
} from '../calendar';
import type {
  DisabledDateMatcher,
  NepaliCalendarDay,
  NepaliDateChangeContext,
  NepaliDateValue,
  NepaliLocale,
  NepaliMonthValue,
  WeekdayIndex,
} from '../types';

export interface NepaliCalendarProps {
  ariaLabel?: string | undefined;
  autoFocus?: boolean | undefined;
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
  showTodayButton?: boolean | undefined;
  value?: NepaliDateValue | null;
  viewDate?: NepaliMonthValue | undefined;
  weekStartsOn?: WeekdayIndex | undefined;
}

export function NepaliCalendar({
  ariaLabel,
  autoFocus = false,
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
  showTodayButton = true,
  value,
  viewDate,
  weekStartsOn = DEFAULT_WEEK_STARTS_ON,
}: NepaliCalendarProps): React.JSX.Element {
  const today = React.useMemo(() => getNepaliToday(), []);
  const [internalView, setInternalView] = React.useState<NepaliMonthValue>(() =>
    toMonthValue(value ?? defaultViewDate ?? today),
  );
  const [focusedDate, setFocusedDate] = React.useState<NepaliDateValue>(value ?? today);
  const [prevValue, setPrevValue] = React.useState<NepaliDateValue | null | undefined>(value);
  const dayRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusKey = React.useRef<string | null>(null);

  // Keep the visible month and roving focus in sync when a controlled value changes,
  // e.g. a form reset or an external "go to date" action.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value && (!prevValue || !isSameNepaliDate(value, prevValue))) {
      setFocusedDate(value);
      setInternalView(toMonthValue(value));
    }
  }

  const currentView = viewDate ?? internalView;
  const minBound = React.useMemo(
    () => (minDate && compareNepaliDates(minDate, MIN_BS_DATE) > 0 ? minDate : MIN_BS_DATE),
    [minDate],
  );
  const maxBound = React.useMemo(
    () => (maxDate && compareNepaliDates(maxDate, MAX_BS_DATE) < 0 ? maxDate : MAX_BS_DATE),
    [maxDate],
  );
  const canGoPrev = toMonthIndex(currentView) > toMonthIndex(toMonthValue(minBound));
  const canGoNext = toMonthIndex(currentView) < toMonthIndex(toMonthValue(maxBound));

  const monthLabel = React.useMemo(
    () => getNepaliMonthLabel(currentView, locale),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentView.month, currentView.year, locale],
  );
  const monthNames = React.useMemo(() => getNepaliMonthNames(locale), [locale]);
  const weekdayLabels = React.useMemo(
    () => getWeekdayLabels(locale, 'short', weekStartsOn),
    [locale, weekStartsOn],
  );
  const calendarDays = React.useMemo(
    () =>
      getNepaliMonthGrid({
        fixedWeeks,
        month: currentView.month,
        weekStartsOn,
        year: currentView.year,
      }),
    [currentView.month, currentView.year, fixedWeeks, weekStartsOn],
  );
  const cellLabels = React.useMemo(
    () =>
      new Map(
        calendarDays.map((calendarDay) => [
          calendarDay.key,
          {
            ariaLabel: formatNepaliDate(calendarDay.date, 'ddd, DD MMMM YYYY', locale),
            dayLabel: formatNepaliDate(calendarDay.date, 'D', locale),
          },
        ]),
      ),
    [calendarDays, locale],
  );
  const weeks = React.useMemo(
    () => toWeeks(calendarDays, weekStartsOn),
    [calendarDays, weekStartsOn],
  );

  function isDateUnavailable(date: NepaliDateValue): boolean {
    return isDateDisabled(date, disabledDates, { max: maxDate, min: minDate });
  }

  // The roving tab stop must always land on a rendered cell, even when focusedDate
  // points at another month (e.g. after mouse-driven month navigation).
  const effectiveFocusedDate = React.useMemo(() => {
    const inGrid = (date: NepaliDateValue): boolean =>
      calendarDays.some((calendarDay) => isSameNepaliDate(calendarDay.date, date));

    if (inGrid(focusedDate)) {
      return focusedDate;
    }

    if (value && inGrid(value)) {
      return value;
    }

    if (inGrid(today)) {
      return today;
    }

    const firstAvailable = calendarDays.find(
      (calendarDay) => !calendarDay.outsideMonth && !isDateUnavailable(calendarDay.date),
    );
    return firstAvailable?.date ?? calendarDays[0]!.date;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarDays, disabledDates, focusedDate, maxDate, minDate, today, value]);

  function setView(nextView: NepaliMonthValue): void {
    if (!viewDate) {
      setInternalView(nextView);
    }
    onViewDateChange?.(nextView);
  }

  function clampViewToBounds(view: NepaliMonthValue): NepaliMonthValue {
    const index = Math.min(
      Math.max(toMonthIndex(view), toMonthIndex(toMonthValue(minBound))),
      toMonthIndex(toMonthValue(maxBound)),
    );
    return { month: (index % 12) + 1, year: Math.floor(index / 12) };
  }

  function moveView(amount: number): void {
    setView(clampViewToBounds(shiftMonthValue(currentView, amount)));
  }

  function selectDate(date: NepaliDateValue): void {
    if (isDateUnavailable(date)) {
      return;
    }

    setFocusedDate(date);
    onChange?.(date, createDateChangeContext(date, format, locale));
  }

  function moveFocus(date: NepaliDateValue): void {
    const target = clampNepaliDate(date, { max: maxBound, min: minBound });
    setFocusedDate(target);
    setView(toMonthValue(target));

    // Focus immediately when the target cell is already rendered; otherwise the
    // commit effect below focuses it once the new month's cells exist.
    const key = toNepaliDateKey(target);
    const node = dayRefs.current.get(key);
    if (node) {
      node.focus();
    } else {
      pendingFocusKey.current = key;
    }
  }

  function moveFocusByDays(date: NepaliDateValue, amount: number): void {
    moveFocus(safeAddDays(date, amount));
  }

  function moveFocusByMonths(date: NepaliDateValue, amount: number): void {
    try {
      moveFocus(addNepaliMonths(date, amount));
    } catch {
      moveFocus(amount < 0 ? { ...MIN_BS_DATE } : { ...MAX_BS_DATE });
    }
  }

  function selectToday(): void {
    setView(toMonthValue(today));
    selectDate(today);
    moveFocus(today);
  }

  function handleDayKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    date: NepaliDateValue,
  ): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveFocusByDays(date, 7);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveFocusByDays(date, -1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        moveFocusByDays(date, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocusByDays(date, -7);
        break;
      case 'End':
        event.preventDefault();
        moveFocusByDays(date, 6 - ((7 + toWeekColumn(date, calendarDays)) % 7));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectDate(date);
        break;
      case 'Home':
        event.preventDefault();
        moveFocusByDays(date, -((7 + toWeekColumn(date, calendarDays)) % 7));
        break;
      case 'PageDown':
        event.preventDefault();
        moveFocusByMonths(date, 1);
        break;
      case 'PageUp':
        event.preventDefault();
        moveFocusByMonths(date, -1);
        break;
    }
  }

  // Focus cells after commit: month-crossing keyboard moves land here once the
  // new grid's nodes exist.
  React.useEffect(() => {
    if (pendingFocusKey.current) {
      dayRefs.current.get(pendingFocusKey.current)?.focus();
      pendingFocusKey.current = null;
    }
  });

  React.useEffect(() => {
    if (autoFocus) {
      dayRefs.current.get(toNepaliDateKey(effectiveFocusedDate))?.focus();
    }
    // Focus is only pulled into the grid on mount, when the opener asks for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  function toWeekColumn(date: NepaliDateValue, days: NepaliCalendarDay[]): number {
    const cell = days.find((calendarDay) => isSameNepaliDate(calendarDay.date, date));
    return cell ? (cell.weekday - weekStartsOn + 7) % 7 : 0;
  }

  const todayUnavailable = isDateUnavailable(today);

  return (
    <div className={cx('ndp-calendar', className)}>
      <div className="ndp-calendar__header">
        <button
          aria-label="Previous month"
          className="ndp-icon-button"
          disabled={!canGoPrev}
          onClick={() => moveView(-1)}
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
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
        <div className="ndp-calendar__selects">
          <select
            aria-label="Month"
            className="ndp-calendar__select ndp-calendar__select--month"
            onChange={(event) =>
              setView(
                clampViewToBounds({ month: Number(event.target.value), year: currentView.year }),
              )
            }
            value={currentView.month}
          >
            {monthNames.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
          <select
            aria-label="Year"
            className="ndp-calendar__select ndp-calendar__select--year"
            onChange={(event) =>
              setView(
                clampViewToBounds({ month: currentView.month, year: Number(event.target.value) }),
              )
            }
            value={currentView.year}
          >
            {Array.from({ length: maxBound.year - minBound.year + 1 }, (_, index) => {
              const year = minBound.year + index;
              return (
                <option key={year} value={year}>
                  {locale === 'ne' ? toNepaliDigits(year) : year}
                </option>
              );
            })}
          </select>
        </div>
        <button
          aria-label="Next month"
          className="ndp-icon-button"
          disabled={!canGoNext}
          onClick={() => moveView(1)}
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
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>

      <div aria-live="polite" className="ndp-calendar__heading">
        {monthLabel}
      </div>

      <div
        aria-label={ariaLabel ?? `Calendar for ${monthLabel}`}
        className="ndp-calendar__grid"
        role="grid"
      >
        <div className="ndp-calendar__weekdays" role="row">
          {weekdayLabels.map((weekday) => (
            <div className="ndp-calendar__weekday" key={weekday} role="columnheader">
              {weekday}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div className="ndp-calendar__week" key={week.find(Boolean)?.key ?? weekIndex} role="row">
            {week.map((calendarDay, columnIndex) => {
              if (!calendarDay) {
                return (
                  <div
                    className="ndp-calendar__day ndp-calendar__day--empty"
                    key={`empty-${weekIndex}-${columnIndex}`}
                    role="gridcell"
                  />
                );
              }

              const selected = value ? isSameNepaliDate(calendarDay.date, value) : false;
              const focused = isSameNepaliDate(calendarDay.date, effectiveFocusedDate);
              const unavailable = isDateUnavailable(calendarDay.date);
              const labels = cellLabels.get(calendarDay.key)!;

              return (
                <button
                  aria-disabled={unavailable}
                  aria-label={labels.ariaLabel}
                  aria-selected={selected}
                  className="ndp-calendar__day"
                  data-outside-month={calendarDay.outsideMonth}
                  data-today={calendarDay.isToday}
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
                  <span className="ndp-calendar__day-label">{labels.dayLabel}</span>
                  {calendarDay.isToday ? (
                    <span aria-hidden="true" className="ndp-calendar__day-dot" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {showTodayButton ? (
        <div className="ndp-calendar__footer">
          <button
            className="ndp-calendar__today"
            disabled={todayUnavailable}
            onClick={selectToday}
            type="button"
          >
            {locale === 'ne' ? 'आज' : 'Today'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function safeAddDays(date: NepaliDateValue, amount: number): NepaliDateValue {
  try {
    return addNepaliDays(date, amount);
  } catch {
    return amount < 0 ? { ...MIN_BS_DATE } : { ...MAX_BS_DATE };
  }
}

function toWeeks(
  calendarDays: NepaliCalendarDay[],
  weekStartsOn: WeekdayIndex,
): Array<Array<NepaliCalendarDay | null>> {
  const firstCell = calendarDays[0];
  if (!firstCell) {
    return [];
  }

  const leading = (firstCell.weekday - weekStartsOn + 7) % 7;
  const cells: Array<NepaliCalendarDay | null> = [
    ...Array.from({ length: leading }, () => null),
    ...calendarDays,
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return Array.from({ length: cells.length / 7 }, (_, weekIndex) =>
    cells.slice(weekIndex * 7, weekIndex * 7 + 7),
  );
}

function toMonthValue(date: NepaliDateValue | NepaliMonthValue): NepaliMonthValue {
  return {
    month: date.month,
    year: date.year,
  };
}

function toMonthIndex(view: NepaliMonthValue): number {
  return view.year * 12 + (view.month - 1);
}

function shiftMonthValue(view: NepaliMonthValue, amount: number): NepaliMonthValue {
  const index = toMonthIndex(view) + amount;
  return { month: (((index % 12) + 12) % 12) + 1, year: Math.floor(index / 12) };
}

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const;

function toNepaliDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => NEPALI_DIGITS[Number(digit)]!);
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
