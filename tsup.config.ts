import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  tsconfig: './tsconfig.build.json',
  dts: true,
  external: ['eslint', 'valibot', '@typescript-eslint/utils'],
  sourcemap: true,
  clean: true,
  target: 'node22',
  splitting: false,
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
});
