# @arclogi/nepali-date-picker

Accessible React components and TypeScript utilities for Bikram Sambat (BS) Nepali date input.

One package for the whole job: a drop-in date input with a popover calendar, a standalone
calendar grid, and the full set of BS/AD conversion and date-math utilities underneath —
lightweight, dependency-lean, and themeable with plain CSS variables.

Live demo: [arclogi.github.io/nepali-date-picker](https://arclogi.github.io/nepali-date-picker/)

## Features

- React 18 and React 19 compatible; ships `"use client"` for Next.js App Router.
- TypeScript-first public API with correct types for both ESM and CommonJS consumers.
- `NepaliDateInput` / `NepaliDatePicker`: popover picker with typing support, clear button,
  controlled or uncontrolled value and open state, and hidden-input form integration.
- `NepaliCalendar`: standalone month grid with fast month/year dropdown navigation and a
  Today shortcut.
- English and Nepali (Devanagari) localization.
- Full keyboard support and WAI-ARIA grid/dialog semantics; visible focus states.
- AD ↔ BS conversion, parsing, formatting, comparison, clamping, and date math utilities —
  also available from a server-safe `./core` entry.
- Themeable via `--ndp-*` CSS custom properties and stable, documented class names, with an
  opt-in dark theme.
- BS 2000 – BS 2090 supported range with safe, non-crashing behavior at the boundaries.

## Install

```sh
npm install @arclogi/nepali-date-picker
```

The npm package name is scoped because the unscoped `nepali-date-picker` name is already used
by a legacy jQuery package.

## Quick start

```tsx
import { useState } from 'react';
import { NepaliDateInput, type NepaliDateValue } from '@arclogi/nepali-date-picker';
import '@arclogi/nepali-date-picker/styles.css';

export function ProfileForm() {
  const [dob, setDob] = useState<NepaliDateValue | null>(null);

  return (
    <>
      <label htmlFor="dob">Date of birth (BS)</label>
      <NepaliDateInput
        id="dob"
        value={dob}
        onChange={(date) => setDob(date)}
        placeholder="YYYY-MM-DD"
        maxDate={{ year: 2085, month: 12, day: 30 }}
      />
    </>
  );
}
```

### Standalone calendar

```tsx
import { NepaliCalendar } from '@arclogi/nepali-date-picker';
import '@arclogi/nepali-date-picker/styles.css';

export function CalendarExample() {
  return (
    <NepaliCalendar
      defaultViewDate={{ year: 2081, month: 1 }}
      locale="ne"
      onChange={(date, context) => {
        console.log(date, context.ad, context.formatted);
      }}
    />
  );
}
```

## Components

### `<NepaliDateInput />` (alias: `<NepaliDatePicker />`)

A text input with a popover calendar. Accepts every native `<input>` prop (except the ones it
manages) plus:

| Prop                                                                      | Type                                     | Default        | Description                                                                                                                |
| ------------------------------------------------------------------------- | ---------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `value`                                                                   | `NepaliDateValue \| null`                | —              | Controlled selected date.                                                                                                  |
| `defaultValue`                                                            | `NepaliDateValue`                        | —              | Initial date when uncontrolled.                                                                                            |
| `onChange`                                                                | `(date, context) => void`                | —              | Fires with the new date (or `null` on clear) and a `NepaliDateChangeContext` (`{ ad, bs, formatted }`).                    |
| `open` / `defaultOpen`                                                    | `boolean`                                | `false`        | Controlled / initial popover visibility.                                                                                   |
| `onOpenChange`                                                            | `(open: boolean) => void`                | —              | Popover visibility change requests.                                                                                        |
| `readOnly`                                                                | `boolean`                                | `true`         | With `readOnly={false}`, users can type a date; it is parsed and committed on Enter or blur, and invalid text reverts.     |
| `clearable`                                                               | `boolean`                                | `true`         | Show the clear button when a date is selected.                                                                             |
| `closeOnSelect`                                                           | `boolean`                                | `true`         | Close the popover after picking a date.                                                                                    |
| `name`                                                                    | `string`                                 | —              | Renders a hidden input carrying the canonical `YYYY-MM-DD` value (ASCII digits, regardless of locale) for HTML form posts. |
| `format`                                                                  | `string`                                 | `'YYYY-MM-DD'` | Display format (converter tokens: `YYYY`, `MM`, `MMMM`, `DD`, `ddd`, …).                                                   |
| `locale`                                                                  | `'en' \| 'ne'`                           | `'en'`         | Localizes the display value and calendar.                                                                                  |
| `minDate` / `maxDate`                                                     | `NepaliDateValue`                        | —              | Selection and navigation bounds.                                                                                           |
| `disabledDates`                                                           | `NepaliDateValue[] \| (date) => boolean` | —              | Dates that cannot be selected.                                                                                             |
| `viewDate` / `defaultViewDate`                                            | `NepaliMonthValue`                       | —              | Controlled / initial visible month.                                                                                        |
| `weekStartsOn`                                                            | `0–6`                                    | `0` (Sunday)   | First day of the week.                                                                                                     |
| `calendarProps`                                                           | `object`                                 | —              | Extra props for the embedded `NepaliCalendar` (e.g. `showTodayButton`).                                                    |
| `className` / `inputClassName` / `popoverClassName` / `calendarClassName` | `string`                                 | —              | Class hooks for each layer.                                                                                                |

A `ref` is forwarded to the native `<input>` element.

The popover opens on click, ArrowDown, or Enter/Space (when read-only) — not on focus alone —
and closes on outside click, Escape, or when focus leaves the component, returning focus to the
input. It automatically flips above the input when there is not enough room below; the flip
direction is measured when the popover opens and is not re-evaluated while scrolling with the
popover held open.

### `<NepaliCalendar />`

The standalone month grid used inside the popover.

| Prop                           | Type                                     | Default                | Description                                                                        |
| ------------------------------ | ---------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| `value`                        | `NepaliDateValue \| null`                | —                      | Selected date. The visible month follows controlled value changes.                 |
| `onChange`                     | `(date, context) => void`                | —                      | Selection callback.                                                                |
| `viewDate` / `defaultViewDate` | `NepaliMonthValue`                       | —                      | Controlled / initial visible month.                                                |
| `onViewDateChange`             | `(view) => void`                         | —                      | Visible month change requests.                                                     |
| `minDate` / `maxDate`          | `NepaliDateValue`                        | —                      | Bounds for selection, navigation, and the year dropdown.                           |
| `disabledDates`                | `NepaliDateValue[] \| (date) => boolean` | —                      | Unselectable dates (kept focusable for keyboard users, per the ARIA grid pattern). |
| `showTodayButton`              | `boolean`                                | `true`                 | Show the Today shortcut in the footer.                                             |
| `locale`                       | `'en' \| 'ne'`                           | `'en'`                 | Month names, weekday names, and digits.                                            |
| `weekStartsOn`                 | `0–6`                                    | `0`                    | First day of the week.                                                             |
| `fixedWeeks`                   | `boolean`                                | `true`                 | Always render six weeks.                                                           |
| `format`                       | `string`                                 | `'YYYY-MM-DD'`         | Format used for the `context.formatted` value.                                     |
| `ariaLabel`                    | `string`                                 | `Calendar for <month>` | Accessible name for the grid.                                                      |
| `autoFocus`                    | `boolean`                                | `false`                | Move focus into the grid on mount (used by the popover for keyboard openers).      |

Keyboard: arrow keys move by day/week, `Home`/`End` jump to the week edges, `PageUp`/`PageDown`
switch months, `Enter`/`Space` select. Month and year dropdowns in the header jump anywhere in
the supported range without paging.

## Utilities

All utilities are exported from the package root and from the server-safe subpath
`@arclogi/nepali-date-picker/core` (no `"use client"` directive, no React import), which is the
one to use inside React Server Components.

```ts
import {
  toBS,
  toAD, // AD ↔ BS conversion (throws RangeError outside BS 2000–2090)
  parseNepaliDate,
  formatNepaliDate, // 'YYYY-MM-DD' parsing and token-based formatting
  toNepaliDateKey, // canonical ASCII 'YYYY-MM-DD' key
  getNepaliToday, // today's BS date; pass a time zone, e.g. getNepaliToday('Asia/Kathmandu')
  isValidNepaliDate,
  assertValidNepaliDate,
  compareNepaliDates,
  isSameNepaliDate,
  isNepaliDateBefore,
  isNepaliDateAfter,
  addNepaliDays,
  addNepaliMonths,
  startOfNepaliMonth,
  endOfNepaliMonth,
  getDaysInNepaliMonth,
  clampNepaliDate, // clamp into a { min, max } range
  getNepaliMonthGrid, // calendar grid cells for custom pickers
  getNepaliMonthLabel,
  getNepaliMonthNames,
  getWeekdayLabels,
  isDateDisabled,
  MIN_BS_DATE,
  MAX_BS_DATE,
  SUPPORTED_BS_YEAR_RANGE,
  getSupportedAdRange,
} from '@arclogi/nepali-date-picker/core';

toBS(new Date(2024, 3, 13)); // { year: 2081, month: 1, day: 1 }
toAD({ year: 2081, month: 1, day: 1 }); // local-noon Date for 2024-04-13
formatNepaliDate({ year: 2081, month: 1, day: 1 }, 'DD MMMM YYYY', 'ne'); // '०१ बैशाख २०८१'
getNepaliToday('Asia/Kathmandu'); // today's BS date in Nepal, on any server
```

`getNepaliToday()` with no argument uses the machine's local calendar day; pass
`'Asia/Kathmandu'` when you need Nepal's civil day regardless of where the code runs.

## Theming and customization

Import the stylesheet once, then override the CSS custom properties — globally on `:root` or
scoped to any wrapper:

```css
:root {
  --ndp-accent: #0f766e; /* primary accent (selected day, focus rings) */
  --ndp-accent-strong: #115e59; /* hover accent */
  --ndp-accent-soft: #ccfbf1; /* soft accent fills */
  --ndp-accent-rgb: 15, 118, 110; /* accent as RGB triplet, for translucent shadows */
  --ndp-text: #221f1a;
  --ndp-muted: #5b6560;
  --ndp-panel: #ffffff; /* calendar and input background */
  --ndp-surface: #f6f5f2; /* hover surfaces */
  --ndp-border: #e7e9ec;
  --ndp-border-strong: #8a949e; /* input border */
  --ndp-selected-text: #ffffff; /* text on the selected day */
  --ndp-radius-sm: 8px;
  --ndp-radius-md: 12px;
  --ndp-font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
```

A dark theme ships in the stylesheet — add `class="ndp-dark"` or `data-ndp-theme="dark"` to any
ancestor (e.g. `<html>`).

For deeper restyling, target the stable class names (kept backward compatible across releases):
`ndp-input`, `ndp-input__control`, `ndp-input__field`, `ndp-input__button`, `ndp-input__popover`,
`ndp-calendar`, `ndp-calendar__header`, `ndp-calendar__select`, `ndp-calendar__grid`,
`ndp-calendar__week`, `ndp-calendar__weekday`, `ndp-calendar__day`, `ndp-calendar__footer`,
`ndp-calendar__today`.

## Forms

Give the input a `name` and it renders a hidden input carrying the canonical ASCII
`YYYY-MM-DD` value, so plain HTML form posts and server actions receive a stable value even
when the visible input is localized to Devanagari digits:

```tsx
<form action="/profile" method="post">
  <NepaliDateInput name="dob" locale="ne" defaultValue={{ year: 2081, month: 1, day: 1 }} />
</form>
// posts dob=2081-01-01
```

With `readOnly={false}`, typed text is committed on Enter or blur — a normal submit-button
click blurs the field first, so the committed value is what posts. If you submit
programmatically (`form.requestSubmit()`) while the field still has focus mid-edit, blur or
commit the field first.

For form libraries (react-hook-form, etc.), use the controlled `value`/`onChange` pair, or grab
the native input with the forwarded `ref`.

## Next.js / SSR

The main entry ships a `"use client"` directive, so the components work in the App Router
without wrappers. In Server Components, import utilities from
`@arclogi/nepali-date-picker/core`. The components themselves render safely on the server
(no `window` access during render).

## Date range

The conversion engine supports BS 2000-01-01 through BS 2090-12-30 (AD 1943 – AD 2034).
Utilities throw a `RangeError` outside that range; the calendar clamps navigation at the
boundaries instead of crashing.

## Development

```sh
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npm run demo:dev
```

## Roadmap

- Date-range selection.
- Optional portal rendering for the popover.

## Conversion note

The package uses the MIT-licensed `nepali-date-converter` library for base AD/BS conversion
data and wraps it with a React-friendly, TypeScript-first API.

## License

MIT
