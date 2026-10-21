// @vitest-environment node
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('Stylesheet', () => {
  it('derives translucent accents from --ndp-accent with color-mix()', () => {
    // rgb(var(--ndp-accent-rgb) / x%) is invalid with the documented comma triplet, which
    // dropped the focus ring, hover borders, and the selected-day shadow.
    expect(css).not.toMatch(/rgb\(\s*var\(/);
    expect(css).toMatch(
      /\.ndp-input__control:focus-within\s*\{[^}]*box-shadow:\s*0 0 0 3px color-mix\(in srgb, var\(--ndp-accent\) 14%, transparent\);/,
    );
    expect(css.match(/color-mix\(in srgb, var\(--ndp-accent\) \d+%, transparent\)/g)).toHaveLength(
      5,
    );
  });

  it('keeps --ndp-accent-rgb defined so existing overrides stay valid', () => {
    expect(css).toMatch(/:root\s*\{[^}]*--ndp-accent-rgb:\s*15, 118, 110;/);
  });

  it('hides the outline of the popover, which takes focus only as a press target', () => {
    expect(css).toMatch(/\.ndp-input__popover:focus\s*\{\s*outline: none;\s*\}/);
  });
});
