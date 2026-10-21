import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { NepaliCalendar, NepaliDateInput } from '../src/components';
import type { NepaliDateValue } from '../src/types';

describe('React components', () => {
  it('selects a date from the standalone calendar', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NepaliCalendar
        defaultViewDate={{ year: 2081, month: 1 }}
        onChange={handleChange}
        value={null}
      />,
    );

    await user.click(screen.getByRole('gridcell', { name: 'Saturday, 01 Baisakh 2081' }));

    expect(handleChange).toHaveBeenCalledWith(
      { year: 2081, month: 1, day: 1 },
      expect.objectContaining({
        formatted: '2081-01-01',
      }),
    );
  });

  it('opens a calendar from the input and writes the selected date', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NepaliDateInput
        defaultViewDate={{ year: 2081, month: 1 }}
        onChange={handleChange}
        placeholder="DOB"
      />,
    );

    const input = screen.getByPlaceholderText('DOB');
    await user.click(input);
    await user.click(screen.getByRole('gridcell', { name: 'Saturday, 01 Baisakh 2081' }));

    expect(input).toHaveValue('2081-01-01');
    expect(handleChange).toHaveBeenCalledWith(
      { year: 2081, month: 1, day: 1 },
      expect.objectContaining({
        formatted: '2081-01-01',
      }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('follows controlled value changes by moving the visible month', () => {
    const { rerender } = render(
      <NepaliCalendar onChange={vi.fn()} value={{ year: 2081, month: 1, day: 1 }} />,
    );

    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Baisakh 2081');

    rerender(<NepaliCalendar onChange={vi.fn()} value={{ year: 2082, month: 5, day: 10 }} />);

    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Bhadra 2082');
    expect(screen.getByRole('gridcell', { name: /10 Bhadra 2082/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('renders the supported-range boundary months without crashing', async () => {
    const user = userEvent.setup();

    render(<NepaliCalendar defaultViewDate={{ year: 2090, month: 12 }} onChange={vi.fn()} />);

    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Chaitra 2090');
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();

    // The first supported month renders too, with day 1 present.
    const yearSelect = screen.getByRole('combobox', { name: 'Year' });
    await user.selectOptions(yearSelect, '2000');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Month' }), '1');

    expect(screen.getByRole('gridcell', { name: /01 Baisakh 2000/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
  });

  it('jumps months and years through the header selects', async () => {
    const user = userEvent.setup();

    render(<NepaliCalendar defaultViewDate={{ year: 2081, month: 1 }} onChange={vi.fn()} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '2040');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Month' }), '5');

    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Bhadra 2040');
  });

  it('selects today through the Today shortcut', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<NepaliCalendar defaultViewDate={{ year: 2081, month: 1 }} onChange={handleChange} />);

    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    const [selected] = handleChange.mock.calls[0]!;
    expect(screen.getByRole('grid')).toHaveAccessibleName(
      expect.stringContaining(String(selected.year)),
    );
  });

  it('keeps disabled dates focusable but not selectable', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NepaliCalendar
        defaultViewDate={{ year: 2081, month: 1 }}
        disabledDates={[{ year: 2081, month: 1, day: 2 }]}
        onChange={handleChange}
        value={null}
      />,
    );

    const disabledDay = screen.getByRole('gridcell', { name: 'Sunday, 02 Baisakh 2081' });
    expect(disabledDay).toHaveAttribute('aria-disabled', 'true');
    expect(disabledDay).not.toBeDisabled();

    await user.click(disabledDay);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('supports typing a date when readOnly is disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<NepaliDateInput onChange={handleChange} placeholder="DOB" readOnly={false} />);

    const input = screen.getByPlaceholderText('DOB');
    await user.type(input, '2081-01-15');
    await user.keyboard('{Enter}');

    expect(input).toHaveValue('2081-01-15');
    expect(handleChange).toHaveBeenCalledWith(
      { year: 2081, month: 1, day: 15 },
      expect.objectContaining({ formatted: '2081-01-15' }),
    );
  });

  it('supports typing Devanagari digits in the Nepali locale', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NepaliDateInput locale="ne" onChange={handleChange} placeholder="DOB" readOnly={false} />,
    );

    const input = screen.getByPlaceholderText('DOB');
    await user.type(input, '२०८१-०१-१५');
    await user.keyboard('{Enter}');

    expect(input).toHaveValue('२०८१-०१-१५');
    expect(handleChange).toHaveBeenCalledWith(
      { year: 2081, month: 1, day: 15 },
      expect.objectContaining({ formatted: '२०८१-०१-१५' }),
    );
  });

  it('composes the native input click handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <NepaliDateInput
        onClick={(event) => {
          handleClick();
          event.preventDefault();
        }}
        placeholder="DOB"
      />,
    );

    await user.click(screen.getByPlaceholderText('DOB'));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('reverts unparseable typed text on blur', async () => {
    const user = userEvent.setup();

    render(
      <NepaliDateInput
        defaultValue={{ year: 2081, month: 1, day: 1 }}
        placeholder="DOB"
        readOnly={false}
      />,
    );

    const input = screen.getByPlaceholderText('DOB');
    await user.clear(input);
    await user.type(input, 'not a date');
    await user.tab();

    expect(input).toHaveValue('2081-01-01');
  });

  it('closes the popover with Escape and returns focus to the input', async () => {
    const user = userEvent.setup();

    render(<NepaliDateInput defaultViewDate={{ year: 2081, month: 1 }} placeholder="DOB" />);

    const input = screen.getByPlaceholderText('DOB');
    await user.click(input);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('submits a canonical hidden form value when name is set', async () => {
    const { container } = render(
      <NepaliDateInput
        defaultValue={{ year: 2081, month: 1, day: 1 }}
        locale="ne"
        name="dob"
        placeholder="DOB"
      />,
    );

    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"][name="dob"]');
    expect(hidden).not.toBeNull();
    expect(hidden!.value).toBe('2081-01-01');

    // The visible input shows the localized value while the form value stays canonical.
    expect(screen.getByPlaceholderText('DOB')).toHaveValue('२०८१-०१-०१');
  });

  it('supports controlled open state', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    const { rerender } = render(
      <NepaliDateInput onOpenChange={handleOpenChange} open={false} placeholder="DOB" />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText('DOB'));
    expect(handleOpenChange).toHaveBeenCalledWith(true);
    // Still closed: the consumer controls the state.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<NepaliDateInput onOpenChange={handleOpenChange} open placeholder="DOB" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('forwards a ref to the native input', () => {
    const ref = { current: null as HTMLInputElement | null };

    render(<NepaliDateInput placeholder="DOB" ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByPlaceholderText('DOB'));
  });

  it('clamps the initial view and later bound changes to selectable months', () => {
    const { rerender } = render(
      <NepaliCalendar
        defaultViewDate={{ year: 2080, month: 1 }}
        minDate={{ year: 2081, month: 5, day: 1 }}
        maxDate={{ year: 2081, month: 6, day: 30 }}
      />,
    );

    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Bhadra 2081');
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Baisakh' })).toBeDisabled();

    rerender(<NepaliCalendar maxDate={{ year: 2080, month: 12, day: 30 }} />);
    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Baisakh 2080');
  });

  it('clamps a controlled view outside the supported range', () => {
    render(<NepaliCalendar viewDate={{ year: 2100, month: 1 }} />);
    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Chaitra 2090');
  });

  it('clips selection bounds to supported years for navigation and selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NepaliCalendar
        minDate={{ year: 1990, month: 1, day: 1 }}
        maxDate={{ year: 2100, month: 1, day: 1 }}
        defaultViewDate={{ year: 2100, month: 1 }}
        onChange={onChange}
      />,
    );
    const years = within(screen.getByRole('combobox', { name: 'Year' })).getAllByRole('option');
    expect(years[0]).toHaveValue('2000');
    expect(years.at(-1)).toHaveValue('2090');
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    await user.click(screen.getByRole('gridcell', { name: /30 Chaitra 2090/ }));
    expect(onChange).toHaveBeenCalledWith({ year: 2090, month: 12, day: 30 }, expect.any(Object));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '2000');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Month' }), '1');
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
  });

  it('accepts typed dates when input bounds extend beyond supported years', async () => {
    const user = userEvent.setup();
    render(
      <NepaliDateInput
        minDate={{ year: 1990, month: 1, day: 1 }}
        maxDate={{ year: 2100, month: 1, day: 1 }}
        readOnly={false}
      />,
    );
    const input = screen.getByRole('combobox');
    await user.type(input, '2081-01-15');
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('2081-01-15');
  });

  it('keeps six weeks at the supported boundaries', () => {
    const { rerender } = render(<NepaliCalendar viewDate={{ year: 2090, month: 12 }} />);
    expect(within(screen.getByRole('grid')).getAllByRole('row')).toHaveLength(7);
    rerender(<NepaliCalendar viewDate={{ year: 2000, month: 1 }} />);
    expect(within(screen.getByRole('grid')).getAllByRole('row')).toHaveLength(7);
  });

  it('moves keyboard focus across months and preserves one tab stop', async () => {
    const user = userEvent.setup();
    render(<NepaliCalendar value={{ year: 2081, month: 1, day: 31 }} />);
    await user.click(screen.getByRole('gridcell', { name: /31 Baisakh 2081/ }));
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Jestha 2081');
    expect(screen.getByRole('gridcell', { name: /01 Jestha 2081/ })).toHaveFocus();
    expect(screen.getAllByRole('gridcell').filter((cell) => cell.tabIndex === 0)).toHaveLength(1);
  });

  it('moves Home and End focus to the configured week edges', async () => {
    const user = userEvent.setup();
    render(<NepaliCalendar value={{ year: 2081, month: 1, day: 5 }} weekStartsOn={1} />);
    await user.click(screen.getByRole('gridcell', { name: /05 Baisakh 2081/ }));
    await user.keyboard('{Home}');
    expect(screen.getByRole('gridcell', { name: /Monday, 03 Baisakh 2081/ })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('gridcell', { name: /Sunday, 09 Baisakh 2081/ })).toHaveFocus();
  });

  it('uses the current outside-click callback while the popover is open', () => {
    const original = vi.fn();
    const current = vi.fn();
    const { rerender } = render(<NepaliDateInput open onOpenChange={original} />);
    rerender(<NepaliDateInput open onOpenChange={current} />);
    fireEvent.pointerDown(document.body);
    expect(original).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledWith(false);
  });

  it('omits disabled inputs from form submissions and hides a controlled popover', () => {
    const { container } = render(
      <form>
        <NepaliDateInput name="dob" defaultValue={{ year: 2081, month: 1, day: 1 }} disabled open />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).has('dob')).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('associates the hidden value with the native form prop', () => {
    render(
      <>
        <form id="profile" aria-label="Profile" />
        <NepaliDateInput
          form="profile"
          name="dob"
          defaultValue={{ year: 2081, month: 1, day: 1 }}
        />
      </>,
    );
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('dob')).toBe('2081-01-01');
  });

  it('closes when focus leaves the document', () => {
    render(<NepaliDateInput defaultOpen />);
    fireEvent.blur(screen.getByRole('combobox', { name: '' }), { relatedTarget: null });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears the selected value and returns focus to the input', async () => {
    const user = userEvent.setup();
    render(<NepaliDateInput defaultValue={{ year: 2081, month: 1, day: 1 }} />);
    await user.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('localizes calendar navigation labels', () => {
    render(<NepaliCalendar locale="ne" value={{ year: 2081, month: 1, day: 1 }} />);
    expect(screen.getByRole('grid')).toHaveAccessibleName('बैशाख २०८१ को पात्रो');
    expect(screen.getByRole('button', { name: 'अघिल्लो महिना' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'महिना' })).toBeInTheDocument();
  });
});

describe('Popover focus handling', () => {
  it('keeps the popover open when a press inside blurs the input without a related target', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NepaliDateInput
        defaultViewDate={{ year: 2081, month: 1 }}
        onChange={handleChange}
        placeholder="DOB"
      />,
    );

    const input = screen.getByPlaceholderText('DOB');
    await user.click(input);
    const day = screen.getByRole('gridcell', { name: 'Saturday, 01 Baisakh 2081' });

    // Safari does not focus a pressed button, so the input blurs with no related target.
    fireEvent.pointerDown(day);
    fireEvent.blur(input, { relatedTarget: null });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(day);
    expect(handleChange).toHaveBeenCalledWith(
      { year: 2081, month: 1, day: 1 },
      expect.objectContaining({ formatted: '2081-01-01' }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('makes the popover the focus target for presses on its non-focusable parts', async () => {
    const user = userEvent.setup();

    render(<NepaliDateInput defaultViewDate={{ year: 2081, month: 1 }} placeholder="DOB" />);

    await user.click(screen.getByPlaceholderText('DOB'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('tabindex', '-1');

    await user.click(dialog);
    expect(dialog).toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on a later blur once the press inside has ended', async () => {
    const user = userEvent.setup();

    render(<NepaliDateInput defaultViewDate={{ year: 2081, month: 1 }} placeholder="DOB" />);

    const input = screen.getByPlaceholderText('DOB');
    // The opening press ends with a click.
    await user.click(input);
    fireEvent.blur(input, { relatedTarget: null });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // A cancelled press (for example a scroll gesture) ends without a click.
    await user.click(input);
    const day = screen.getByRole('gridcell', { name: 'Saturday, 01 Baisakh 2081' });
    fireEvent.pointerDown(day);
    fireEvent.pointerCancel(day);
    fireEvent.blur(input, { relatedTarget: null });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Weekday attributes', () => {
  it('exposes the weekday index on headers and day cells', () => {
    render(<NepaliCalendar value={{ year: 2083, month: 7, day: 4 }} weekStartsOn={1} />);

    expect(
      screen.getAllByRole('columnheader').map((header) => header.getAttribute('data-weekday')),
    ).toEqual(['1', '2', '3', '4', '5', '6', '0']);
    expect(screen.getByRole('columnheader', { name: 'Sat' })).toHaveAttribute('data-weekday', '6');
    expect(screen.getByRole('gridcell', { name: 'Saturday, 07 Kartik 2083' })).toHaveAttribute(
      'data-weekday',
      '6',
    );

    // Every row lines up with the headers.
    for (const row of within(screen.getByRole('grid')).getAllByRole('row').slice(1)) {
      expect(
        within(row)
          .getAllByRole('gridcell')
          .map((cell) => cell.getAttribute('data-weekday')),
      ).toEqual(['1', '2', '3', '4', '5', '6', '0']);
    }
  });

  it('sets the weekday on empty cells at the supported-range boundary', () => {
    render(<NepaliCalendar viewDate={{ year: 2000, month: 1 }} />);

    const firstWeek = within(screen.getByRole('grid')).getAllByRole('row')[1]!;
    const cells = within(firstWeek).getAllByRole('gridcell');
    expect(cells.map((cell) => cell.getAttribute('data-weekday'))).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(cells[0]).toHaveClass('ndp-calendar__day--empty');
    expect(cells[3]).toHaveAccessibleName('Wednesday, 01 Baisakh 2000');
  });
});

describe('Calendar dates around Kartik 2083', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows 2026-10-21 as Wednesday 04 Kartik and lets users pick 31 Aswin 2083', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<NepaliCalendar onChange={handleChange} />);

    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Kartik 2083');
    const today = screen.getByRole('gridcell', { current: 'date' });
    expect(today).toHaveAccessibleName('Wednesday, 04 Kartik 2083');
    expect(today).toHaveAttribute('data-weekday', '3');

    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(handleChange).toHaveBeenLastCalledWith(
      { year: 2083, month: 7, day: 4 },
      expect.objectContaining({ formatted: '2083-07-04' }),
    );

    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('gridcell', { name: 'Saturday, 31 Aswin 2083' }));
    expect(handleChange).toHaveBeenLastCalledWith(
      { year: 2083, month: 6, day: 31 },
      expect.objectContaining({ ad: new Date(2026, 9, 17, 12) }),
    );
  });
});

describe('Invalid props', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  it.each<[string, unknown]>([
    ['an impossible day', { year: 2083, month: 6, day: 32 }],
    ['an AD date read as BS', { year: 2026, month: 10, day: 31 }],
    ['a month out of range', { year: 2081, month: 13, day: 1 }],
    ['a year after the supported range', { year: 2095, month: 1, day: 1 }],
    ['a fractional year', { year: 2081.5, month: 1, day: 1 }],
    ['a string from untyped code', '2081-01-01'],
  ])('renders %s as an empty, invalid value instead of throwing', (_, value) => {
    const date = value as NepaliDateValue;
    const { container } = render(
      <>
        <NepaliDateInput name="decided" onChange={vi.fn()} placeholder="DOB" value={date} />
        <NepaliCalendar defaultViewDate={{ year: 2081, month: 1 }} value={date} />
      </>,
    );

    const input = screen.getByPlaceholderText('DOB');
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('.ndp-input')).toHaveAttribute('data-invalid', 'true');
    expect(container.querySelector('input[type="hidden"]')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument();

    expect(container.querySelector('.ndp-calendar')).toHaveAttribute('data-invalid', 'true');
    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Baisakh 2081');
    expect(
      screen
        .getAllByRole('gridcell')
        .filter((cell) => cell.getAttribute('aria-selected') === 'true'),
    ).toHaveLength(0);
  });

  it('warns once per invalid value in development', () => {
    const value = { year: 2083, month: 6, day: 33 };
    const { rerender } = render(<NepaliDateInput onChange={vi.fn()} value={value} />);
    rerender(<NepaliDateInput onChange={vi.fn()} value={{ ...value }} />);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Ignoring invalid value {"year":2083,"month":6,"day":33}'),
    );
  });

  it('stays silent in production builds', () => {
    vi.stubEnv('NODE_ENV', 'production');

    render(<NepaliCalendar value={{ year: 2081, month: 1, day: 40 }} />);

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(warn).not.toHaveBeenCalled();
  });

  it('respects an aria-invalid passed by the consumer', () => {
    const { container } = render(
      <NepaliDateInput aria-invalid="false" value={{ year: 2081, month: 1, day: 41 }} />,
    );

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'false');
    expect(container.querySelector('.ndp-input')).toHaveAttribute('data-invalid', 'true');
  });

  it('replaces an invalid value when the user picks a date', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NepaliDateInput
        defaultValue={{ year: 2026, month: 11, day: 31 }}
        defaultViewDate={{ year: 2083, month: 7 }}
        onChange={handleChange}
        placeholder="DOB"
      />,
    );

    const input = screen.getByPlaceholderText('DOB');
    expect(input).toHaveValue('');
    expect(handleChange).not.toHaveBeenCalled();

    await user.click(input);
    await user.click(screen.getByRole('gridcell', { name: 'Wednesday, 04 Kartik 2083' }));

    expect(input).toHaveValue('2083-07-04');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Ignoring invalid defaultValue'));
  });

  it('makes nothing selectable when minDate is after maxDate', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NepaliCalendar
        maxDate={{ year: 2083, month: 7, day: 5 }}
        minDate={{ year: 2083, month: 7, day: 10 }}
        onChange={handleChange}
      />,
    );

    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Kartik 2083');
    const days = screen.getAllByRole('gridcell').filter((cell) => cell.tagName === 'BUTTON');
    expect(days.length).toBeGreaterThan(0);
    expect(days.every((day) => day.getAttribute('aria-disabled') === 'true')).toBe(true);
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled();
    expect(
      within(screen.getByRole('combobox', { name: 'Year' })).getAllByRole('option'),
    ).toHaveLength(1);

    await user.click(screen.getByRole('gridcell', { name: /07 Kartik 2083/ }));
    expect(handleChange).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('minDate 2083-07-10 is after maxDate 2083-07-05'),
    );
  });

  it('rejects typed dates when minDate is after maxDate', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NepaliDateInput
        maxDate={{ year: 2083, month: 1, day: 1 }}
        minDate={{ year: 2084, month: 1, day: 1 }}
        onChange={handleChange}
        readOnly={false}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, '2083-06-15');
    await user.keyboard('{Enter}');

    expect(input).toHaveValue('');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('ignores invalid bounds and disabledDates entries instead of throwing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NepaliDateInput
        defaultViewDate={{ year: 2081, month: 1 }}
        disabledDates={[
          { year: 2081, month: 1, day: 2 },
          { year: 2081, month: 2, day: 33 },
        ]}
        minDate={{ year: 2081, month: 2, day: 34 }}
        onChange={handleChange}
        placeholder="DOB"
        readOnly={false}
      />,
    );

    const input = screen.getByPlaceholderText('DOB');
    await user.type(input, '2081-01-03');
    await user.keyboard('{Enter}');
    expect(handleChange).toHaveBeenLastCalledWith(
      { year: 2081, month: 1, day: 3 },
      expect.objectContaining({ formatted: '2081-01-03' }),
    );

    await user.click(input);
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeEnabled();
    expect(screen.getByRole('gridcell', { name: 'Sunday, 02 Baisakh 2081' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Ignoring invalid minDate'));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Ignoring invalid disabledDates entry'),
    );
  });

  it('falls back from malformed view months', () => {
    const { rerender } = render(
      <NepaliCalendar
        value={{ year: 2082, month: 5, day: 10 }}
        viewDate={{ year: 2081, month: 0 }}
      />,
    );
    expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Bhadra 2082');

    rerender(<NepaliCalendar defaultViewDate={{ year: 2081.5, month: 1 }} key="uncontrolled" />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Ignoring invalid viewDate'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Ignoring invalid defaultViewDate'));
  });

  it('renders without a today marker when the device clock is outside the supported range', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2040, 0, 1, 12));
    try {
      render(<NepaliCalendar onChange={vi.fn()} />);

      expect(screen.getByRole('grid')).toHaveAccessibleName('Calendar for Chaitra 2090');
      expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled();
      expect(screen.queryByRole('gridcell', { current: 'date' })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
