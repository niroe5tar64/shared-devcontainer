import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: ['esm'],
  outDir: 'dist/cli',
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: false,
  minify: false,
  shims: true,
  external: ['jiti'],
  noExternal: ['citty'],
});
