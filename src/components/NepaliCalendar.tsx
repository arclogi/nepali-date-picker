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

  // Follow external value changes without an extra effect render.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value && (!prevValue || !isSameNepaliDate(value, prevValue))) {
      setFocusedDate(value);
      setInternalView(toMonthValue(value));
    }
  }

  const minBound = minDate ?? MIN_BS_DATE;
  const maxBound = maxDate ?? MAX_BS_DATE;
  if (compareNepaliDates(minBound, maxBound) > 0) {
    throw new RangeError('minDate must be on or before maxDate.');
  }
  const currentView = clampViewToBounds(viewDate ?? internalView);
  const canGoPrev = toMonthIndex(currentView) > toMonthIndex(toMonthValue(minBound));
  const canGoNext = toMonthIndex(currentView) < toMonthIndex(toMonthValue(maxBound));

  const monthLabel = getNepaliMonthLabel(currentView, locale);
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
            dayLabel:
              locale === 'ne' ? toNepaliDigits(calendarDay.date.day) : String(calendarDay.date.day),
          },
        ]),
      ),
    [calendarDays, locale],
  );
  const weeks = React.useMemo(
    () => toWeeks(calendarDays, weekStartsOn, fixedWeeks),
    [calendarDays, fixedWeeks, weekStartsOn],
  );

  const disabledMatcher = React.useMemo(() => {
    if (!disabledDates || typeof disabledDates === 'function') {
      return disabledDates;
    }
    const keys = new Set(disabledDates.map(toNepaliDateKey));
    return (date: NepaliDateValue) => keys.has(toNepaliDateKey(date));
  }, [disabledDates]);
  const isDateUnavailable = React.useCallback(
    (date: NepaliDateValue) =>
      isDateDisabled(date, disabledMatcher, { max: maxDate, min: minDate }),
    [disabledMatcher, maxDate, minDate],
  );

  // Keep one tab stop in the rendered grid after month navigation.
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
  }, [calendarDays, focusedDate, isDateUnavailable, today, value]);

  function setView(nextView: NepaliMonthValue): void {
    if (toMonthIndex(nextView) === toMonthIndex(currentView)) {
      return;
    }
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
    if (date.year !== currentView.year || date.month !== currentView.month) {
      setView(toMonthValue(date));
    }
    onChange?.(date, createDateChangeContext(date, format, locale));
  }

  function moveFocus(date: NepaliDateValue): void {
    const target = clampNepaliDate(date, { max: maxBound, min: minBound });
    setFocusedDate(target);
    setView(toMonthValue(target));

    const key = toNepaliDateKey(target);
    const node = dayRefs.current.get(key);
    pendingFocusKey.current =
      !node || target.year !== currentView.year || target.month !== currentView.month ? key : null;
    node?.focus();
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
    moveFocus(today);
    onChange?.(today, createDateChangeContext(today, format, locale));
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
        moveFocusByDays(date, 6 - toWeekColumn(date, calendarDays));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectDate(date);
        break;
      case 'Home':
        event.preventDefault();
        moveFocusByDays(date, -toWeekColumn(date, calendarDays));
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

  // Month changes can replace the focused node.
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
    // Focus only on activation, never during ordinary navigation.
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
          aria-label={locale === 'ne' ? 'अघिल्लो महिना' : 'Previous month'}
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
            aria-label={locale === 'ne' ? 'महिना' : 'Month'}
            className="ndp-calendar__select ndp-calendar__select--month"
            onChange={(event) =>
              setView(
                clampViewToBounds({ month: Number(event.target.value), year: currentView.year }),
              )
            }
            value={currentView.month}
          >
            {monthNames.map((monthName, index) => (
              <option
                disabled={
                  toMonthIndex({ year: currentView.year, month: index + 1 }) <
                    toMonthIndex(minBound) ||
                  toMonthIndex({ year: currentView.year, month: index + 1 }) >
                    toMonthIndex(maxBound)
                }
                key={monthName}
                value={index + 1}
              >
                {monthName}
              </option>
            ))}
          </select>
          <select
            aria-label={locale === 'ne' ? 'वर्ष' : 'Year'}
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
          aria-label={locale === 'ne' ? 'अर्को महिना' : 'Next month'}
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
        aria-label={
          ariaLabel ?? (locale === 'ne' ? `${monthLabel} को पात्रो` : `Calendar for ${monthLabel}`)
        }
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
                  aria-current={calendarDay.isToday ? 'date' : undefined}
                  aria-label={labels.ariaLabel}
                  aria-selected={selected}
                  className="ndp-calendar__day"
                  data-outside-month={calendarDay.outsideMonth}
                  data-today={calendarDay.isToday}
                  key={calendarDay.key}
                  onClick={() => selectDate(calendarDay.date)}
                  onFocus={() => setFocusedDate(calendarDay.date)}
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
  fixedWeeks: boolean,
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
  while (cells.length % 7 !== 0 || (fixedWeeks && cells.length < 42)) {
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
