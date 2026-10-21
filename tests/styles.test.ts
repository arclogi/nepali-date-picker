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

  it('falls back to --ndp-accent-rgb only in browsers without color-mix()', () => {
    const fallbacks = [
      ...css.matchAll(
        /@supports not \(color: color-mix\(in srgb, red 50%, transparent\)\) \{([\s\S]*?)\n\}/g,
      ),
    ].map((match) => match[1]!);

    // One fallback per color-mix() rule: select hover, button hover, selected day, focus ring.
    expect(fallbacks).toHaveLength(4);
    expect(fallbacks.join('').match(/rgba\(var\(--ndp-accent-rgb\), 0\.\d+\)/g)).toHaveLength(5);
    expect(fallbacks.join('')).not.toMatch(/color-mix/);
    expect(fallbacks.join('')).toMatch(
      /\.ndp-input__control:focus-within\s*\{\s*box-shadow: 0 0 0 3px rgba\(var\(--ndp-accent-rgb\), 0\.14\);/,
    );

    // Outside those blocks the stylesheet never reads --ndp-accent-rgb.
    const outside = css.replace(
      /@supports not \(color: color-mix\(in srgb, red 50%, transparent\)\) \{[\s\S]*?\n\}/g,
      '',
    );
    expect(outside).not.toMatch(/var\(--ndp-accent-rgb\)/);
  });

  it('hides the outline of the popover, which takes focus only as a press target', () => {
    expect(css).toMatch(/\.ndp-input__popover:focus\s*\{\s*outline: none;\s*\}/);
  });
});
