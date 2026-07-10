import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NepaliCalendar, NepaliDateInput } from '../src/components';

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
    const user = userEvent.setup();

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
    expect(user).toBeDefined();
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
});
