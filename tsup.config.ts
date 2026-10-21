import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  // tsup injects the deprecated baseUrl option while bundling declarations.
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  entry: { index: 'src/index.ts', core: 'src/core.ts' },
  external: ['react'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  // Emit the shared utilities once, as a chunk that both entries import, so apps that use the
  // components and ./core do not bundle the date code twice. scripts/postbuild.mjs checks this.
  splitting: true,
  treeshake: true,
});
