// @vitest-environment node
/**
 * The calendar rendered in Chrome (Playwright's 'chrome' channel, the browser installed on the
 * machine), with customizable selects (`appearance: base-select`) and as a browser without them
 * sees the stylesheet (Firefox, Safari, Chrome before 135): the `@supports (appearance:
 * base-select)` blocks never apply, and ::picker-icon, ::picker(), ::checkmark and :open are
 * selectors it cannot parse. Skipped where Chrome is missing, except in CI.
 *
 * Text is set in Arial (Liberation Sans on Linux, which has Arial's metrics and comes with Chrome
 * there), so the widths are the same on every machine.
 */
import { readFileSync } from 'node:fs';
import { chromium, type Browser, type Page } from 'playwright-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NepaliCalendar } from '../src/components';
import type { NepaliLocale } from '../src/types';

const STYLESHEET = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const STYLES = {
  customizable: STYLESHEET,
  fallback: STYLESHEET.replaceAll(
    '@supports (appearance: base-select)',
    '@supports (appearance: none-such)',
  )
    .replace(/::picker-icon|::picker(?=\()|::checkmark/g, '::ndp-unknown')
    .replace(/:open\b/g, ':ndp-unknown'),
};
const FONT = "Arial, 'Liberation Sans', sans-serif";
/**
 * The narrowest calendar whose header keeps the month, the year and Today whole, as README says:
 * with the default 14px padding, 36px buttons and 4px gaps, a 286px calendar leaves them 11rem.
 */
const MIN_WIDTH = 286;
const LOCALES: NepaliLocale[] = ['en', 'ne'];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface Row {
  clipped: string[];
  room: number;
  width: number;
}

let browser: Browser | null = null;

beforeAll(async () => {
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (error) {
    if (process.env.CI) {
      throw error;
    }
    console.warn(`layout tests skipped, no Chrome to run them in: ${String(error).split('\n')[0]}`);
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

/** A page with one calendar, Today in its header. */
async function open(
  kind: keyof typeof STYLES,
  locale: NepaliLocale,
  month: number,
): Promise<Page | null> {
  if (!browser) {
    return null;
  }
  const page = await browser.newPage({ viewport: { height: 600, width: 800 } });
  const calendar = renderToStaticMarkup(
    <NepaliCalendar
      locale={locale}
      todayButtonPlacement="header"
      value={{ day: 1, month, year: 2083 }}
      viewDate={{ month, year: 2083 }}
    />,
  );
  await page.setContent(
    `<style>${STYLES[kind]}</style>
     <style>
       .ndp-calendar { --ndp-font-family: ${FONT}; }
       .natural .ndp-calendar__selects > * { flex-shrink: 0 !important; }
     </style>
     ${calendar}`,
  );
  // Chrome 135 or later, so the customizable path really is one.
  expect(await page.evaluate(() => CSS.supports('appearance', 'base-select'))).toBe(true);
  return page;
}

/** For each calendar width: the room for the month, year and Today, and which of them are cut. */
function measure(page: Page, from: number, to: number): Promise<Row[]> {
  return page.evaluate(
    ({ from, to }): Row[] => {
      const calendar = document.querySelector<HTMLElement>('.ndp-calendar')!;
      const room = document.querySelector('.ndp-calendar__selects')!;
      const items = [...room.children];
      const widths = () => items.map((item) => item.getBoundingClientRect().width);
      const rows: Row[] = [];
      for (let width = to; width >= from; width -= 1) {
        calendar.style.width = `${width}px`;
        const actual = widths();
        document.body.classList.add('natural');
        const natural = widths();
        document.body.classList.remove('natural');
        rows.push({
          clipped: items
            .filter((_, index) => natural[index]! - actual[index]! > 0.5)
            .map((item) => item.className.split(' ').at(-1)!),
          room: room.getBoundingClientRect().width,
          width,
        });
      }
      return rows;
    },
    { from, to },
  );
}

describe.each(Object.keys(STYLES) as Array<keyof typeof STYLES>)(
  'Header Today in Chrome (%s selects)',
  (kind) => {
    it.for(LOCALES)(
      'keeps the month, the year and Today whole from the minimum width up, and never cuts the year or Today (%s)',
      { timeout: 60_000 },
      async (locale, context) => {
        // One page per selected month: a customizable select is as wide as its selected option.
        const pages = await Promise.all(MONTHS.map((month) => open(kind, locale, month)));
        if (pages.includes(null)) {
          return context.skip();
        }
        const measured = await Promise.all(pages.map((page) => measure(page!, 200, 360)));
        await Promise.all(pages.map((page) => page!.close()));
        measured.forEach((rows, index) => {
          const where = `${locale}, month ${MONTHS[index]}`;
          expect(rows.find((row) => row.width === MIN_WIDTH)!.room, where).toBeCloseTo(176, 0);
          expect(
            rows.filter((row) => row.width >= MIN_WIDTH && row.clipped.length),
            where,
          ).toEqual([]);
          // Narrower, only the month name gives way.
          expect(
            rows.flatMap((row) => row.clipped).filter((name) => !name.endsWith('--month')),
            where,
          ).toEqual([]);
        });
      },
    );

    it('drops every transition when the user asks for reduced motion', async (context) => {
      const page = await open(kind, 'en', 1);
      if (!page) {
        return context.skip();
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const durations = await page.evaluate(() =>
        [
          ...document.querySelectorAll(
            '.ndp-calendar__day, .ndp-calendar__select, .ndp-calendar__today, .ndp-icon-button',
          ),
        ].map((element) => getComputedStyle(element).transitionDuration),
      );
      await page.close();
      expect(durations.length).toBeGreaterThan(40);
      expect(new Set(durations)).toEqual(new Set(['0s']));
    });
  },
);
