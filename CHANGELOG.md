# Changelog

## 1.0.2 (2026-07-10)

### Fixed

- Editable inputs now accept both ASCII and Devanagari digits, so `locale="ne"` users can type
  the same localized date format the input displays.
- Native input `onClick` handlers are now composed with the calendar opener and can prevent the
  popover from opening with `event.preventDefault()`.

## 1.0.1 (2026-07-05)

### Fixed

- The focused date input no longer draws a double border: the inner text field's focus outline
  is removed and the control's accent ring is the single focus indicator.

### Added

- Themed month/year dropdown lists in browsers that support customizable selects (Chromium's
  `appearance: base-select`): the open list now matches the calendar theme, with the selected
  option highlighted and checkmarked. Other browsers keep the native list.

## 1.0.0 (2026-07-05)

First stable release.

### Added

- Fast month and year dropdown navigation in the calendar header (BS 2000–2090).
- Today shortcut button (`showTodayButton`, on by default; localized as "आज" for `locale="ne"`).
- Manual typing support: with `readOnly={false}` the input parses typed dates on Enter or blur,
  reverting invalid text to the last committed value.
- Controlled popover state via `open` / `defaultOpen` / `onOpenChange`.
- HTML form integration: a `name` prop renders a hidden input with the canonical ASCII
  `YYYY-MM-DD` value regardless of display locale.
- `ref` forwarding to the native input on `NepaliDateInput` / `NepaliDatePicker`.
- Popover flips above the input when there is not enough space below.
- Server-safe `@arclogi/nepali-date-picker/core` subpath exposing all utilities without the
  `"use client"` directive.
- `"use client"` banner in the main bundle for Next.js App Router compatibility.
- Opt-in dark theme (`.ndp-dark` or `data-ndp-theme="dark"`).
- New utilities: `clampNepaliDate`, `getNepaliMonthNames`, `getSupportedAdRange`; `getNepaliToday`
  now accepts an optional IANA time zone (e.g. `'Asia/Kathmandu'`).
- `Home` / `End` keyboard navigation in the calendar grid.

### Fixed

- Calendar no longer crashes (BS 2090-12) or renders a corrupted grid (BS 2000-01) at the
  supported-range boundary months; month navigation clamps at the bounds and the chevrons
  disable at `minDate` / `maxDate`.
- `toBS` and `addNepaliDays` now throw a `RangeError` for AD dates outside the supported BS
  range instead of silently returning mirrored, wrong dates.
- The visible month and selection now follow controlled `value` changes.
- Keyboard access: the roving tab stop always lands on a rendered day; disabled dates stay
  focusable (`aria-disabled`) so arrow navigation cannot get stuck; Escape closes the popover
  from anywhere inside it and returns focus to the input; the popover closes when focus leaves
  the component; focus returns to the input after selection.
- ARIA: the grid now uses proper `row` structure with the weekday header row inside it; the
  input uses combobox semantics with `aria-haspopup="dialog"`; the popover dialog is labelled.
- CommonJS TypeScript consumers no longer fail with TS1479: the exports map now points
  `require` to `index.d.cts`.
- `parseNepaliDate` rejects mixed separators (e.g. `2081-01/01`).
- Nepali locale: the month header now renders Devanagari digits and converter-consistent month
  names; `BS_MONTHS_NE` aligned with formatted output.
- Contrast and touch-target improvements (input border, outside-month days, 36 px header
  buttons, 38 px day cells).
- The popover closes if the input becomes `disabled` while open.

### Changed

- The popover no longer opens when the input merely receives focus (it opens on click,
  ArrowDown, or Enter/Space when read-only). Focus-open conflicted with returning focus to the
  input after selection and surprised keyboard users tabbing through forms.
- `NepaliCalendar` memoizes grid computation; day-cell labels are computed once per view.
- The calendar heading is now a visually hidden live region; the visible header uses the
  month/year dropdowns.
- Version 1.0.0 marks a stable public API: components, utilities, `--ndp-*` variables, and
  `ndp-*` class names follow semver from here on.
