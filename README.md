# @arclogi/nepali-date-picker

Accessible React components and TypeScript utilities for Bikram Sambat Nepali date input.

This package is being built to give Nepali product teams and application developers a reliable, modern date picker that works with current React and TypeScript projects.

## Features

- React 18 and React 19 compatible components.
- TypeScript-first public API.
- AD to BS and BS to AD utilities.
- BS date parsing, formatting, comparison, and date math.
- Calendar grid helpers for building custom date pickers.
- Bikram Sambat date input and calendar picker. In progress.
- Keyboard-friendly calendar navigation. In progress.
- Customizable CSS with stable class names.
- Tests for date math, rendering, and interaction behavior.

## Install

```sh
npm install @arclogi/nepali-date-picker
```

The npm package name is scoped because the unscoped `nepali-date-picker` name is already used by a legacy jQuery package.

## Development

```sh
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## Usage

```tsx
import {
  formatNepaliDate,
  getNepaliMonthGrid,
  parseNepaliDate,
  toAD,
  toBS,
} from '@arclogi/nepali-date-picker';

const bsDate = toBS(new Date(2024, 3, 13));
// { year: 2081, month: 1, day: 1 }

const adDate = toAD({ year: 2081, month: 1, day: 1 });
// Local-noon JavaScript Date for 2024-04-13.

formatNepaliDate(parseNepaliDate('2081-01-01'), 'YYYY MMMM DD');
// "2081 Baisakh 01"

const days = getNepaliMonthGrid({ year: 2081, month: 1 });
// 42 calendar cells, including outside-month leading/trailing days.
```

## Date range

The first implementation targets the BS range supported by the conversion engine: BS 2000 to BS 2090. Dates outside that range throw a `RangeError`.

## Conversion note

The package uses the MIT-licensed `nepali-date-converter` library for base AD/BS conversion data and wraps it with a React-friendly, TypeScript-first API.

## License

MIT
