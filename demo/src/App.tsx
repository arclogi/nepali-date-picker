import * as React from 'react';
import {
  NepaliCalendar,
  NepaliDateInput,
  formatNepaliDate,
  toAD,
  type NepaliDateValue,
  type NepaliLocale,
} from '@arclogi/nepali-date-picker';
import '@arclogi/nepali-date-picker/styles.css';

const INSTALL_COMMAND = 'npm install @arclogi/nepali-date-picker';

const FEATURES: string[] = [
  'React 18 and React 19 compatible components',
  'TypeScript-first public API',
  'AD ↔ BS conversion utilities built in',
  'Keyboard-friendly calendar navigation',
  'Customizable CSS with stable, documented class names',
];

export function App(): React.JSX.Element {
  const [date, setDate] = React.useState<NepaliDateValue | null>({
    day: 1,
    month: 1,
    year: 2081,
  });
  const [copied, setCopied] = React.useState(false);
  const [locale, setLocale] = React.useState<NepaliLocale>('en');

  const adDate = date ? toAD(date) : null;

  async function handleCopy(): Promise<void> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(INSTALL_COMMAND);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Clipboard access can be denied by the browser; fail silently.
    }
  }

  return (
    <main className="demo-shell">
      <div className="demo-grid">
        <section className="demo-pitch" aria-labelledby="demo-title">
          <p className="demo-kicker">React &middot; TypeScript &middot; Bikram Sambat</p>
          <h1 id="demo-title">Nepali Date Picker</h1>
          <p className="demo-copy">
            An accessible, themeable Bikram Sambat date picker built for modern React
            applications&mdash;drop-in date input, standalone calendar grid, and BS/AD conversion
            utilities included.
          </p>

          <ul className="demo-feature-list">
            {FEATURES.map((feature) => (
              <li className="demo-feature" key={feature}>
                <span aria-hidden="true" className="demo-feature-icon">
                  <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="demo-install">
            <code className="demo-install-command">{INSTALL_COMMAND}</code>
            <button className="demo-install-copy" onClick={() => void handleCopy()} type="button">
              {copied ? (
                <svg fill="none" height="15" viewBox="0 0 24 24" width="15">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                </svg>
              ) : (
                <svg fill="none" height="15" viewBox="0 0 24 24" width="15">
                  <rect
                    height="13"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    width="13"
                    x="8"
                    y="8"
                  />
                  <path
                    d="M5 16V5a2 2 0 0 1 2-2h11"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                </svg>
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="demo-links">
            <a
              className="demo-link"
              href="https://github.com/arclogi/nepali-date-picker"
              rel="noreferrer"
              target="_blank"
            >
              <svg
                aria-hidden="true"
                fill="currentColor"
                height="16"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-1.9c-3.13.68-3.79-1.5-3.79-1.5-.51-1.31-1.25-1.66-1.25-1.66-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.94.1-.73.4-1.22.72-1.5-2.5-.29-5.13-1.25-5.13-5.57 0-1.23.44-2.24 1.16-3.02-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.11 1.16a10.8 10.8 0 0 1 5.66 0c2.16-1.46 3.11-1.16 3.11-1.16.61 1.57.23 2.73.11 3.02.72.78 1.16 1.79 1.16 3.02 0 4.33-2.64 5.28-5.15 5.56.41.36.77 1.05.77 2.12v3.14c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z" />
              </svg>
              GitHub
            </a>
            <a
              className="demo-link"
              href="https://www.npmjs.com/package/@arclogi/nepali-date-picker"
              rel="noreferrer"
              target="_blank"
            >
              <svg
                aria-hidden="true"
                fill="currentColor"
                height="16"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M1.5 3.5h21v17h-11v-14h-6.5v14h-3.5v-17Z" />
              </svg>
              npm
            </a>
          </div>
        </section>

        <section className="demo-live" aria-labelledby="demo-live-title">
          <div className="demo-card">
            <p className="demo-card-eyebrow">Live demo</p>
            <h2 className="demo-card-title" id="demo-live-title">
              Try the date input
            </h2>

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
              <span>Selected date</span>
              <strong>{date ? formatNepaliDate(date, 'DD MMMM YYYY') : 'No date selected'}</strong>
              {adDate ? (
                <small>
                  AD {adDate.getFullYear()}-{pad2(adDate.getMonth() + 1)}-{pad2(adDate.getDate())}
                </small>
              ) : (
                <small>Pick a date to see the AD equivalent</small>
              )}
            </div>
          </div>

          <div className="demo-card demo-card--calendar">
            <div className="demo-card-heading">
              <div>
                <p className="demo-card-eyebrow">Standalone component</p>
                <h2 className="demo-card-title">NepaliCalendar</h2>
              </div>
              <div aria-label="Calendar locale" className="demo-locale-toggle" role="group">
                <button
                  aria-pressed={locale === 'en'}
                  className="demo-locale-button"
                  onClick={() => setLocale('en')}
                  type="button"
                >
                  EN
                </button>
                <button
                  aria-pressed={locale === 'ne'}
                  className="demo-locale-button"
                  onClick={() => setLocale('ne')}
                  type="button"
                >
                  ने
                </button>
              </div>
            </div>
            <p className="demo-card-copy">
              Embed just the calendar grid&mdash;no input required&mdash;with English or Nepali
              localization built in.
            </p>
            <div className="demo-calendar-frame">
              <NepaliCalendar
                defaultViewDate={{ year: date?.year ?? 2081, month: date?.month ?? 1 }}
                locale={locale}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
