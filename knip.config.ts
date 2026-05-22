import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  $schema: 'https://unpkg.com/knip@6/schema.json',
  entry: ['scripts/*.ts'],
  project: ['src/**/*.ts', 'scripts/**/*.ts'],
  ignore: ['src/utils/type-aware.ts'],
};

export default config;
