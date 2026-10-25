import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NepaliCalendar, NepaliDateInput } from '../src/components';
import { inState, parseCss, specificity, winner } from './cascade';

const LIBRARY = parseCss(
  readFileSync(new NodeURL('../src/styles.css', import.meta.url), 'utf8'),
  'ndp',
);

/**
 * What a host app brings along, unlayered and after the picker's stylesheet (the worst case for
 * specificity): @tailwindcss/forms 0.5's base rules for selects and text inputs (its ring and border
 * in blue-600, its gray select arrow) and global focus styles. Blue marks every host value.
 */
const HOST_BLUE = '#2563eb';
const HOST = parseCss(
  `
  [type='text'], input:where(:not([type])), select {
    appearance: none;
    background-color: #fff;
    border-color: #6b7280;
    border-width: 1px;
    border-radius: 0;
    padding: 0.5rem 0.75rem;
    --tw-shadow: 0 0 #0000;
  }
  [type='text']:focus, input:where(:not([type])):focus, select:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
    --tw-ring-color: ${HOST_BLUE};
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    border-color: ${HOST_BLUE};
  }
  select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath stroke='${HOST_BLUE}' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }
  :focus { outline: 2px solid ${HOST_BLUE}; }
  button:focus { box-shadow: 0 0 0 3px ${HOST_BLUE}; }
  *:focus-visible { outline: 3px solid ${HOST_BLUE}; }
  `,
  'host',
);
const PAGE = [...LIBRARY, ...HOST];
const BASE_SELECT = '@supports (appearance: base-select)';
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';
/** What a browser without customizable selects cannot parse (Firefox, Safari, Chrome < 135). */
const CUSTOMIZABLE_SELECT_ONLY = /::picker|::checkmark|:open\b/;
const FALLBACK = { conditions: [], unknownSelectors: CUSTOMIZABLE_SELECT_ONLY };
const BROWSERS = [FALLBACK, { conditions: [BASE_SELECT] }];
const RING = '2px solid var(--ndp-focus, var(--ndp-accent))';

function renderCalendar() {
  render(
    <NepaliCalendar
      todayButtonPlacement="header"
      value={{ year: 2081, month: 1, day: 1 }}
      viewDate={{ year: 2081, month: 1 }}
    />,
  );
  return {
    buttons: [
      screen.getByRole('button', { name: 'Previous month' }),
      screen.getByRole('button', { name: 'Next month' }),
      screen.getByRole('button', { name: 'Today' }),
      screen.getByRole('gridcell', { name: 'Sunday, 02 Baisakh 2081' }),
    ],
    selects: [
      screen.getByRole('combobox', { name: 'Month' }),
      screen.getByRole('combobox', { name: 'Year' }),
    ],
  };
}

describe('Focus colour (--ndp-focus)', () => {
  it('draws every focus ring of the calendar, the input, and its buttons with --ndp-focus', async () => {
    const user = userEvent.setup();
    render(
      <NepaliDateInput
        defaultValue={{ year: 2081, month: 1, day: 1 }}
        placeholder="DOB"
        todayButtonPlacement="header"
      />,
    );
    await user.click(screen.getByPlaceholderText('DOB'));

    const controls = [
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('combobox').filter((element) => element.tagName === 'SELECT'),
      screen.getByRole('gridcell', { name: 'Sunday, 02 Baisakh 2081' }),
    ];
    // Clear, toggle, previous, Today, next.
    expect(controls.filter((element) => element.tagName === 'BUTTON')).toHaveLength(6);
    for (const control of controls) {
      for (const options of BROWSERS) {
        expect(
          inState(control, ['focus', 'focus-visible'], () =>
            winner(control, 'outline', PAGE, options),
          ),
          control.className,
        ).toEqual({ sheet: 'ndp', value: RING });
      }
    }

    const box = document.querySelector('.ndp-input__control')!;
    inState(box, ['focus-within'], () => {
      expect(winner(box, 'border-color', PAGE)?.value).toBe('var(--ndp-focus, var(--ndp-accent))');
      expect(winner(box, 'box-shadow', PAGE)?.value).toBe(
        '0 0 0 3px color-mix(in srgb, var(--ndp-focus, var(--ndp-accent)) 14%, transparent)',
      );
    });
  });

  it('leaves --ndp-focus unset, so a value on any ancestor reaches every ring', () => {
    const declared = LIBRARY.flatMap((rule) => rule.declarations).map((d) => d.property);
    expect(declared).toContain('--ndp-accent');
    expect(declared).not.toContain('--ndp-focus');
    // No ring reads the accent directly any more.
    for (const rule of LIBRARY) {
      for (const declaration of rule.declarations) {
        if (declaration.property === 'outline' && declaration.value.includes('solid')) {
          expect(declaration.value, rule.selectors.join(', ')).toBe(RING);
        }
      }
    }
  });
});

describe('Host styles', () => {
  it('keeps a form plugin’s ring, border colour and outline off the month and year selects', () => {
    const { selects } = renderCalendar();
    for (const select of selects) {
      for (const options of BROWSERS) {
        const where = `${select.className} ${options.conditions.join('')}`;
        inState(select, ['focus', 'focus-visible'], () => {
          expect(winner(select, 'box-shadow', PAGE, options), where).toEqual({
            sheet: 'ndp',
            value: 'none',
          });
          expect(winner(select, 'border-color', PAGE, options), where).toEqual({
            sheet: 'ndp',
            value: 'var(--ndp-border)',
          });
          expect(winner(select, 'outline', PAGE, options)?.value, where).toBe(RING);
        });
        // A pointer focus shows no outline at all, not the host's.
        inState(select, ['focus'], () => {
          expect(winner(select, 'outline', PAGE, options), where).toEqual({
            sheet: 'ndp',
            value: 'none',
          });
        });
      }
    }
  });

  it('draws its own light chevron on the selects, never the host’s select arrow', () => {
    const { selects } = renderCalendar();
    for (const select of selects) {
      const fallback = winner(select, 'background-image', PAGE);
      expect(fallback?.sheet).toBe('ndp');
      // Two thin strokes in the theme's muted colour.
      expect(fallback?.value.match(/linear-gradient\(/g)).toHaveLength(2);
      expect(fallback?.value).toContain('var(--ndp-muted)');
      expect(fallback?.value).not.toContain('url(');
      for (const property of ['background-position', 'background-repeat', 'background-size']) {
        expect(winner(select, property, PAGE)?.sheet, property).toBe('ndp');
      }
      // Customizable selects draw the chevron as the picker icon instead.
      expect(winner(select, 'background-image', PAGE, { conditions: [BASE_SELECT] })).toEqual({
        sheet: 'ndp',
        value: 'none',
      });
    }

    const icon = LIBRARY.find(
      (rule) =>
        rule.conditions.includes(BASE_SELECT) &&
        rule.selectors.includes('.ndp-calendar__select::picker-icon'),
    )!;
    const style = Object.fromEntries(icon.declarations.map((d) => [d.property, d.value]));
    expect(style).toMatchObject({
      'background-color': 'var(--ndp-muted)',
      content: "''",
      'flex-shrink': '0',
    });
    expect(style.mask).toMatch(/^url\("data:image\/svg\+xml/);
  });

  it('keeps a host’s button ring and outline off the calendar’s buttons', () => {
    const { buttons } = renderCalendar();
    for (const button of buttons) {
      inState(button, ['focus', 'focus-visible'], () => {
        expect(winner(button, 'box-shadow', PAGE), button.className).toEqual({
          sheet: 'ndp',
          value: 'none',
        });
      });
      inState(button, ['focus'], () => {
        expect(winner(button, 'outline', PAGE), button.className).toEqual({
          sheet: 'ndp',
          value: 'none',
        });
      });
    }
  });

  it('keeps the selected day’s own shadow while it has focus', () => {
    renderCalendar();
    const selected = screen.getByRole('gridcell', { name: 'Saturday, 01 Baisakh 2081' });
    expect(selected).toHaveAttribute('aria-selected', 'true');
    inState(selected, ['focus', 'focus-visible'], () => {
      expect(winner(selected, 'box-shadow', PAGE)?.value).toContain(
        'color-mix(in srgb, var(--ndp-accent) 55%, transparent)',
      );
    });
  });

  it('keeps a host’s text-input ring off the field, whose control draws the focus', () => {
    render(<NepaliDateInput placeholder="DOB" />);
    const field = screen.getByPlaceholderText('DOB');
    inState(field, ['focus', 'focus-visible'], () => {
      expect(winner(field, 'box-shadow', PAGE)).toEqual({ sheet: 'ndp', value: 'none' });
      expect(winner(field, 'border-color', PAGE)).toEqual({ sheet: 'ndp', value: 'transparent' });
      expect(winner(field, 'outline', PAGE)?.value).toMatch(/^(none|0)$/);
    });
  });

  it('resets only the picker’s own classes', () => {
    for (const rule of LIBRARY) {
      for (const selector of rule.selectors) {
        if (selector === ':root' || selector.startsWith('@')) {
          continue;
        }
        // Every selector names a picker class or the opt-in theme attribute.
        expect(selector, selector).toMatch(/\.ndp-|\[data-ndp-theme|\[data-today-placement/);
      }
    }
    // Enough to beat element and attribute selectors such as select:focus and [type='text']:focus.
    expect(specificity('.ndp-calendar__select:focus')).toEqual([0, 2, 0]);
    expect(specificity('select:focus')).toEqual([0, 1, 1]);
    expect(specificity('.ndp-input__control .ndp-input__field:focus')).toEqual([0, 3, 0]);
    expect(specificity("[type='text']:focus")).toEqual([0, 2, 0]);
    // The focused select's border: above select:focus, below a host's .my-app .ndp-calendar__select.
    expect(specificity('select.ndp-calendar__select:not(input):where(:focus)')).toEqual([0, 1, 2]);
  });

  it('keeps a host’s own select border colour on a focused select, and the hover border over it', () => {
    // A class-level host rule loaded before the picker, as the judiciary kit does.
    const before = parseCss('.my-app .ndp-calendar__select { border-color: #999999; }', 'app');
    render(
      <div className="my-app">
        <NepaliCalendar todayButtonPlacement="header" viewDate={{ year: 2081, month: 1 }} />
      </div>,
    );
    for (const select of screen.getAllByRole('combobox')) {
      for (const options of BROWSERS) {
        for (const page of [
          [...before, ...LIBRARY],
          [...before, ...LIBRARY, ...HOST],
        ]) {
          inState(select, ['focus', 'focus-visible'], () => {
            expect(winner(select, 'border-color', page, options)).toEqual({
              sheet: 'app',
              value: '#999999',
            });
          });
          inState(select, ['focus', 'hover'], () => {
            expect(winner(select, 'border-color', page, options)).toEqual({
              sheet: 'ndp',
              value: 'color-mix(in srgb, var(--ndp-accent) 35%, transparent)',
            });
          });
        }
      }
    }
  });
});

describe('Customizable selects', () => {
  it('rings the option reached with the arrow keys in the open list with --ndp-focus', () => {
    renderCalendar();
    const option = within(screen.getByRole('combobox', { name: 'Month' })).getByRole('option', {
      name: 'Jestha',
    });
    const options = { conditions: [BASE_SELECT] };
    inState(option, ['focus', 'focus-visible'], () => {
      expect(winner(option, 'outline', PAGE, options)).toEqual({ sheet: 'ndp', value: RING });
      expect(winner(option, 'outline-offset', PAGE, options)?.value).toBe('-2px');
    });
    // The pointer only tints the option.
    inState(option, ['hover'], () => {
      expect(winner(option, 'outline', PAGE, options)?.value).toBe('none');
      expect(winner(option, 'background', PAGE, options)?.value).toBe('var(--ndp-surface)');
    });
  });

  it('centres the month and year text on the row, like the picker icon and a header Today', () => {
    const { selects } = renderCalendar();
    for (const select of selects) {
      expect(winner(select, 'align-items', LIBRARY, { conditions: [BASE_SELECT] })?.value).toBe(
        'center',
      );
    }
  });
});

describe('Reduced motion', () => {
  it('drops the transitions in every browser, with or without customizable selects', () => {
    render(<NepaliDateInput defaultOpen todayButtonPlacement="header" placeholder="DOB" />);
    const elements = [
      ...document.querySelectorAll(
        '.ndp-calendar__day, .ndp-calendar__select, .ndp-calendar__today, .ndp-icon-button, .ndp-input__button, .ndp-input__control',
      ),
    ];
    expect(elements.length).toBeGreaterThan(40);
    for (const element of elements) {
      for (const browser of BROWSERS) {
        const options = { ...browser, conditions: [...browser.conditions, REDUCED_MOTION] };
        expect(winner(element, 'transition', LIBRARY, options)?.value, element.className).toBe(
          'none',
        );
      }
    }
    // The picker icon's own reset reaches only browsers that know ::picker-icon.
    const icon = LIBRARY.find((rule) =>
      rule.selectors.includes('.ndp-calendar__select::picker-icon'),
    )!;
    expect(icon.conditions).toContain(BASE_SELECT);
    const reset = LIBRARY.find(
      (rule) =>
        rule.conditions.includes(REDUCED_MOTION) &&
        rule.selectors.includes('.ndp-calendar__select::picker-icon'),
    )!;
    expect(reset.conditions).toEqual([REDUCED_MOTION, BASE_SELECT]);
    expect(reset.selectors).toHaveLength(1);
  });

  it('models the browser that drops a selector list naming a pseudo-element it does not know', () => {
    // 1.0.5 before this fix: ::picker-icon in the same list as the days lost every reset there.
    const sheet = parseCss(
      `.ndp-calendar__day { transition: color 0.15s ease; }
       @media (prefers-reduced-motion: reduce) {
         .ndp-calendar__day, .ndp-calendar__select::picker-icon { transition: none; }
       }`,
      'ndp',
    );
    render(<NepaliCalendar viewDate={{ year: 2081, month: 1 }} />);
    const day = screen.getByRole('gridcell', { name: 'Saturday, 01 Baisakh 2081' });
    const reduced = { conditions: [REDUCED_MOTION] };
    expect(winner(day, 'transition', sheet, reduced)?.value).toBe('none');
    expect(
      winner(day, 'transition', sheet, { ...reduced, unknownSelectors: CUSTOMIZABLE_SELECT_ONLY })
        ?.value,
    ).toBe('color 0.15s ease');
  });
});
