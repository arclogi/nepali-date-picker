# @arclogi/nepali-date-picker

Accessible React components and TypeScript utilities for Bikram Sambat Nepali date input.

This package is being built to give Nepali product teams and application developers a reliable, modern date picker that works with current React and TypeScript projects.

## Planned features

- React 18 and React 19 compatible components.
- TypeScript-first public API.
- Bikram Sambat date input and calendar picker.
- AD to BS and BS to AD utilities.
- Keyboard-friendly calendar navigation.
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

## Date range

The first implementation targets the BS range supported by the conversion engine: BS 2000 to BS 2090. The supported range will be documented and tested as the package evolves.

## License

MIT

