import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/nepali-date-picker/',
  build: {
    emptyOutDir: true,
    outDir: '../dist-demo',
    sourcemap: true,
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@arclogi/nepali-date-picker/styles.css': fileURLToPath(
        new URL('../src/styles.css', import.meta.url),
      ),
      '@arclogi/nepali-date-picker': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
  root: fileURLToPath(new URL('.', import.meta.url)),
});
