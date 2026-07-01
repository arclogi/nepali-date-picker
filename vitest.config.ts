import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['dist/**', 'tests/**', '*.config.*'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
    environment: 'happy-dom',
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
