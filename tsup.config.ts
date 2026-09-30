import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  // tsup injects the deprecated baseUrl option while bundling declarations.
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  entry: { index: 'src/index.ts', core: 'src/core.ts' },
  external: ['react'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  splitting: false,
  treeshake: true,
});
