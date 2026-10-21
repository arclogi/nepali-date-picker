# Changelog

## 1.0.4 (2026-10-21)

### Fixed

- Pressing a day in Safari, and in Firefox on macOS, now selects it. Neither focuses a pressed
  button, so the input blurred with no related target and the popover closed before the click
  landed. The popover is now a focus target (`tabIndex={-1}`), and a blur during a press that
  started inside the component no longer closes it; the press ends with a click, a focus change
  inside, a cancel, a release outside the component, or a press outside it. Pressing the
  popover's padding or the gaps between days no longer closes it in other browsers either.
- The input focus ring, hover borders, and selected-day shadow are visible again. They used
  `rgb(var(--ndp-accent-rgb) / x%)`, which is invalid CSS with the documented comma triplet; they
  now use `color-mix(in srgb, var(--ndp-accent) x%, transparent)`, so `--ndp-accent-rgb` is no
  longer required. Browsers without `color-mix()` (Chrome < 111, Safari < 16.2, Firefox < 113)
  fall back to `rgba(var(--ndp-accent-rgb), x)`, which now works there too.
- The components no longer throw during render:
  - an invalid or out-of-range `value` / `defaultValue` renders as an empty field marked with
    `data-invalid` (and `aria-invalid="true"` unless you pass your own); the Clear button stays
    available so users can remove it;
  - `minDate` after `maxDate` makes no date selectable instead of throwing;
  - an invalid `minDate` / `maxDate` also makes no date selectable, so it never opens up the whole
    range;
  - a malformed `viewDate` / `defaultViewDate` and invalid `disabledDates` entries are ignored;
  - a device clock outside the supported range shows no today marker and disables Today
    (`getNepaliMonthGrid` also stops throwing in that case).

  Development builds log one warning per distinct problem; production builds stay silent.

### Added

- `data-weekday` (`0` = Sunday … `6` = Saturday) on weekday headers and day cells, so apps can
  style Saturdays or any other weekday whatever `weekStartsOn` is.
- Tests that pin the engine to the published calendar for 2083: all twelve month lengths, Asoj
  has 31 days, and Kartik 1 is Sunday 18 October 2026 (`bikram-sambat-js` gets this wrong,
  shifting later dates by a day).
- README: the values of every data attribute, with the selectors to use (`[data-today='true']`,
  not `[data-today]`).

### Changed

- The build emits the shared date code once per format: `index` and `core` both import it from a
  shared chunk instead of each bundling a copy, so apps that use both entries ship it once. The
  `./core` entry and the chunk stay free of React and `"use client"`; the build now checks this.
- CI checks the packed package with `publint --strict` and `@arethetypeswrong/cli --pack`.

## 1.0.3 (2026-09-30)

### Fixed

- Clamp calendar views to date bounds and preserve six-week layouts at supported boundaries.
- Clip selection bounds outside supported years for both calendar navigation and typed input.
- Limit the CI workflow token to read-only repository contents.
- Keep keyboard focus when crossing months, and localize navigation labels in Nepali.
- Use current popover callbacks and omit disabled hidden inputs from form submissions.
- Respect external form association and restore input focus after clearing.
- Keep the input ref mutable with both React 18 and React 19 types.
- Reject invalid AD date strings instead of silently rolling them into another month.
- Prevent mobile overflow and preserve selected-day contrast on adjacent-month cells.

### Changed

- Reduce grid conversions and use indexed lookups for disabled-date lists.
- Simplify the package build to generate both entries in one pass.
- Test React 18 and current React with TypeScript 5.9 and current TypeScript consumers.
- Upgrade development React to 19.3 and refresh development dependencies.
- Connect both demo components to the same selected date and locale.

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
