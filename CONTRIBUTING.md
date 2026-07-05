# Contributing

Thanks for helping improve `@arclogi/nepali-date-picker`. Issues and pull requests are welcome.

## How to contribute

Direct pushes to `main` are not accepted — all changes land through pull requests:

1. **Fork** the repository on GitHub (the Fork button on the repo page).
2. **Clone your fork** and create a feature branch:

   ```sh
   git clone https://github.com/<your-username>/nepali-date-picker.git
   cd nepali-date-picker
   git checkout -b fix/describe-your-change
   ```

3. **Make your change** and verify everything passes locally:

   ```sh
   npm install
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```

4. **Push the branch to your fork** and open a **pull request** against `arclogi/nepali-date-picker`'s `main` branch. CI runs the same checks on Node 20, 22, and 24 — a green build is required before merging.

For anything non-trivial (new props, behavior changes, new components), please open an issue first so we can agree on the direction before you invest time.

## Local development

```sh
npm install
npm run demo:dev   # live playground at http://localhost:5173
npm run test:watch
```

## Project standards

- Keep the public API TypeScript-first and framework-friendly.
- Add tests for date conversion, date math, and UI behavior when changing those areas.
- Keep component styles scoped with the `ndp-` class prefix; never rename or remove existing
  `ndp-*` class names or `--ndp-*` variables — they are documented public API.
- Preserve ARIA roles/attributes and keyboard behavior; the tests query by role and
  accessible name.
- Document user-facing API changes in `README.md` and add a `CHANGELOG.md` entry.

## Commit style

Use short, clear commit messages that explain the project change:

```txt
Add calendar grid utilities
Improve date input keyboard handling
```
