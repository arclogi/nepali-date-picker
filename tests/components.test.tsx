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
});
