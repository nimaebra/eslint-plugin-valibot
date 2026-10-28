import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/types.ts'],
      thresholds: {
        statements: 95,
        branches: 92,
        functions: 98,
        lines: 95,
      },
    },
  },
});
