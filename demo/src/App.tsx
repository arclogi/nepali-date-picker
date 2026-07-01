import * as React from 'react';
import {
  NepaliDateInput,
  formatNepaliDate,
  toAD,
  type NepaliDateValue,
} from '@arclogi/nepali-date-picker';
import '@arclogi/nepali-date-picker/styles.css';

export function App(): React.JSX.Element {
  const [date, setDate] = React.useState<NepaliDateValue | null>({
    day: 1,
    month: 1,
    year: 2081,
  });

  const adDate = date ? toAD(date) : null;

  return (
    <main className="demo-shell">
      <section className="demo-panel" aria-labelledby="demo-title">
        <p className="demo-kicker">React + TypeScript</p>
        <h1 id="demo-title">Nepali Date Picker</h1>
        <p className="demo-copy">
          A simple Bikram Sambat date input built for modern React applications.
        </p>

        <div className="demo-picker">
          <label htmlFor="demo-date">Choose a BS date</label>
          <NepaliDateInput
            id="demo-date"
            value={date}
            onChange={setDate}
            placeholder="Select BS date"
          />
        </div>

        <div className="demo-result" aria-live="polite">
          <span>Selected</span>
          <strong>{date ? formatNepaliDate(date, 'DD MMMM YYYY') : 'No date selected'}</strong>
          {adDate ? (
            <small>
              AD {adDate.getFullYear()}-{pad2(adDate.getMonth() + 1)}-{pad2(adDate.getDate())}
            </small>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
