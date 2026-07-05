import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  dts: true,
  external: ['react'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  splitting: false,
  treeshake: true,
};

export default defineConfig([
  {
    ...shared,
    banner: { js: "'use client';" },
    clean: true,
    entry: { index: 'src/index.ts' },
  },
  {
    // Server-safe utilities entry without the "use client" banner.
    ...shared,
    clean: false,
    entry: { core: 'src/core.ts' },
  },
]);
