const warnedMessages = new Set<string>();

/** Logs each distinct message once, and only in development builds. */
export function warnInDevelopment(message: string): void {
  if (!isDevelopment() || warnedMessages.has(message)) {
    return;
  }

  warnedMessages.add(message);
  console.warn(`[@arclogi/nepali-date-picker] ${message}`);
}

/** Prints a prop value for a warning without ever throwing. */
export function describeValue(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function isDevelopment(): boolean {
  try {
    // Bundlers replace this expression; without one, `process` may not exist at all.
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}
