// @vitest-environment node
import { readFileSync } from 'node:fs';
import { parseCss } from './cascade';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('Stylesheet', () => {
  it('derives translucent accents from --ndp-accent with color-mix()', () => {
    // rgb(var(--ndp-accent-rgb) / x%) is invalid with the documented comma triplet, which
    // dropped the focus ring, hover borders, and the selected-day shadow.
    expect(css).not.toMatch(/rgb\(\s*var\(/);
    // The input's focus ring reads --ndp-focus, which falls back to --ndp-accent.
    expect(css).toMatch(
      /\.ndp-input__control:focus-within\s*\{[^}]*box-shadow:\s*0 0 0 3px color-mix\(in srgb, var\(--ndp-focus, var\(--ndp-accent\)\) 14%, transparent\);/,
    );
    expect(css.match(/color-mix\(in srgb, var\(--ndp-accent\) \d+%, transparent\)/g)).toHaveLength(
      4,
    );
    expect(
      css.match(/color-mix\(in srgb, var\(--ndp-focus, var\(--ndp-accent\)\) \d+%, transparent\)/g),
    ).toHaveLength(1);
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

  it('keeps the 1.0.4 footer Today: a centred button in a ruled row under the days', () => {
    const footer = css.match(/\n\.ndp-calendar__footer \{([^}]*)\}/)![1]!;
    expect(footer).toMatch(/border-top: 1px solid var\(--ndp-border\);/);
    expect(footer).toMatch(/justify-content: center;/);
    expect(footer).toMatch(/margin-top: 10px;/);
    expect(footer).toMatch(/padding-top: 8px;/);
    const today = css.match(/\n\.ndp-calendar__today \{([^}]*)\}/)![1]!;
    expect(today).toMatch(/padding: 8px 14px;/);
    expect(today).not.toMatch(/min-height|display|flex/);
    // Only a Today in the header is compact.
    const header = css.match(/\n\.ndp-calendar__today--header \{([^}]*)\}/)![1]!;
    expect(header).toMatch(/padding: 0 6px;/);
    expect(header).toMatch(/flex-shrink: 0;/);
  });

  it('names customizable-select selectors only inside @supports (appearance: base-select)', () => {
    // A browser that does not know ::picker-icon, ::picker(), ::checkmark or :open drops the whole
    // selector list that names one, so such a selector never shares a list with older ones and
    // only appears where @supports (appearance: base-select) keeps other browsers out.
    const rules = parseCss(css, 'ndp');
    const customizable = /::picker|::checkmark|:open\b/;
    const found = rules.filter((rule) => rule.selectors.some((s) => customizable.test(s)));
    expect(found.length).toBeGreaterThan(4);
    for (const rule of found) {
      const where = rule.selectors.join(', ');
      expect(rule.conditions, where).toContain('@supports (appearance: base-select)');
    }
  });

  it('no longer draws the select chevron with a fixed colour', () => {
    // The fallback chevron is two gradients in --ndp-muted; the old data URI had a fixed grey.
    expect(css).not.toMatch(/%23888f95/);
  });
});
