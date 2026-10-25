/**
 * A small CSS cascade for the tests: which declaration wins on an element, from the source of a
 * stylesheet. Rules are matched with the DOM's own Element.matches and ordered by importance,
 * specificity and source order (every sheet here is unlayered). A rule inside an at-rule applies
 * only when its condition is listed in `conditions`, for example
 * `@supports (appearance: base-select)`. Interaction states are attributes: `:hover`,
 * `:focus-visible`, `:focus-within` and `:focus` match `[data-hover]`, `[data-focus-visible]`,
 * `[data-focus-within]` and `[data-focus]`. `unknownSelectors` models a browser that cannot parse
 * some selectors: like CSS, it drops every rule whose selector list has one of them.
 */
export interface Declaration {
  important: boolean;
  property: string;
  value: string;
}

export interface CssRule {
  conditions: string[];
  declarations: Declaration[];
  selectors: string[];
  sheet: string;
}

export interface CascadeOptions {
  conditions?: readonly string[];
  /** Selectors the browser does not know, for example /::picker-icon/ without customizable selects. */
  unknownSelectors?: RegExp;
}

type Specificity = [number, number, number];

/** Splits on a separator outside brackets and quotes: "a, b:not(c, d)" -> ["a", "b:not(c, d)"]. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(' || char === '[') {
      depth += 1;
    } else if (char === ')' || char === ']') {
      depth -= 1;
    } else if (char === separator && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

function closingBrace(css: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let index = open; index < css.length; index += 1) {
    const char = css[index];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}' && (depth -= 1) === 0) {
      return index;
    }
  }
  throw new Error('Unbalanced braces in the stylesheet');
}

/** Flattens a stylesheet into style rules, each with the at-rule preludes around it. */
export function parseCss(text: string, sheet: string): CssRule[] {
  const css = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: CssRule[] = [];
  const walk = (from: number, to: number, conditions: string[]): void => {
    let index = from;
    while (index < to) {
      const open = css.indexOf('{', index);
      if (open === -1 || open >= to) {
        break;
      }
      const prelude = css.slice(index, open).trim();
      const close = closingBrace(css, open);
      if (prelude.startsWith('@keyframes')) {
        // Holds no rules for elements.
      } else if (prelude.startsWith('@')) {
        walk(open + 1, close, [...conditions, prelude.replace(/\s+/g, ' ')]);
      } else {
        rules.push({
          conditions,
          declarations: splitTopLevel(css.slice(open + 1, close), ';').map((declaration) => {
            const colon = declaration.indexOf(':');
            const value = declaration
              .slice(colon + 1)
              .trim()
              .replace(/\s+/g, ' ');
            return {
              important: /!\s*important$/i.test(value),
              property: declaration.slice(0, colon).trim().toLowerCase(),
              value: value.replace(/\s*!\s*important$/i, ''),
            };
          }),
          selectors: splitTopLevel(prelude, ','),
          sheet,
        });
      }
      index = close + 1;
    }
  };
  walk(0, css.length, []);
  return rules;
}

const compare = (a: Specificity, b: Specificity): number =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/** [ids, classes, types] for one complex selector; :where() counts nothing, :not/:is/:has their argument. */
export function specificity(selector: string): Specificity {
  const counts: Specificity = [0, 0, 0];
  const identEnd = (from: number): number => {
    let end = from;
    while (end < selector.length && /[\w-]/.test(selector[end]!)) end += 1;
    return end;
  };
  const groupEnd = (from: number): number => {
    let depth = 0;
    for (let end = from; end < selector.length; end += 1) {
      if (selector[end] === '(') depth += 1;
      else if (selector[end] === ')' && (depth -= 1) === 0) return end;
    }
    return selector.length;
  };
  for (let index = 0; index < selector.length;) {
    const char = selector[index]!;
    if (char === '#') {
      counts[0] += 1;
      index = identEnd(index + 1);
    } else if (char === '.') {
      counts[1] += 1;
      index = identEnd(index + 1);
    } else if (char === '[') {
      counts[1] += 1;
      index = selector.indexOf(']', index) + 1;
    } else if (char === ':' && selector[index + 1] === ':') {
      counts[2] += 1;
      index = identEnd(index + 2);
      if (selector[index] === '(') index = groupEnd(index) + 1;
    } else if (char === ':') {
      const end = identEnd(index + 1);
      const name = selector.slice(index + 1, end);
      if (selector[end] === '(') {
        const close = groupEnd(end);
        if (['not', 'is', 'has'].includes(name)) {
          const inner = splitTopLevel(selector.slice(end + 1, close), ',')
            .map(specificity)
            .sort(compare)
            .at(-1)!;
          counts[0] += inner[0];
          counts[1] += inner[1];
          counts[2] += inner[2];
        } else if (name !== 'where') {
          counts[1] += 1;
        }
        index = close + 1;
      } else {
        counts[1] += 1;
        index = end;
      }
    } else if (/[a-z*]/i.test(char)) {
      if (char !== '*') counts[2] += 1;
      index = char === '*' ? index + 1 : identEnd(index);
    } else {
      index += 1;
    }
  }
  return counts;
}

/** The selector with interaction states read from attributes. */
const withStates = (selector: string): string =>
  selector
    .replaceAll(':focus-visible', '[data-focus-visible]')
    .replaceAll(':focus-within', '[data-focus-within]')
    .replace(/:focus(?![-\w])/g, '[data-focus]')
    .replaceAll(':hover', '[data-hover]');

function matchSpecificity(element: Element, selectors: string[]): Specificity | null {
  let best: Specificity | null = null;
  for (const selector of selectors) {
    if (selector.includes('::')) {
      continue; // styles a pseudo-element, not the element
    }
    let matches = false;
    try {
      matches = element.matches(withStates(selector));
    } catch {
      matches = false; // a pseudo-class the DOM does not know, such as :open
    }
    if (matches) {
      const value = specificity(selector);
      if (!best || compare(value, best) > 0) best = value;
    }
  }
  return best;
}

/** The declaration of `property` that wins on the element, and the sheet it comes from. */
export function winner(
  element: Element,
  property: string,
  rules: readonly CssRule[],
  { conditions = [], unknownSelectors }: CascadeOptions = {},
): { sheet: string; value: string } | undefined {
  const reached: Array<Declaration & { order: number; sheet: string; spec: Specificity }> = [];
  rules.forEach((rule, order) => {
    if (!rule.conditions.every((condition) => conditions.includes(condition))) {
      return;
    }
    if (unknownSelectors && rule.selectors.some((selector) => unknownSelectors.test(selector))) {
      return; // one selector the browser cannot parse invalidates the whole list
    }
    const spec = matchSpecificity(element, rule.selectors);
    if (!spec) {
      return;
    }
    for (const declaration of rule.declarations) {
      if (declaration.property === property) {
        reached.push({ ...declaration, order, sheet: rule.sheet, spec });
      }
    }
  });
  reached.sort(
    (a, b) =>
      Number(a.important) - Number(b.important) || compare(a.spec, b.spec) || a.order - b.order,
  );
  const last = reached.at(-1);
  return last && { sheet: last.sheet, value: last.value };
}

/** Puts the element in interaction states (`focus`, `focus-visible`, `hover`) while `read` runs. */
export function inState<T>(element: Element, states: readonly string[], read: () => T): T {
  states.forEach((state) => element.setAttribute(`data-${state}`, ''));
  try {
    return read();
  } finally {
    states.forEach((state) => element.removeAttribute(`data-${state}`));
  }
}
