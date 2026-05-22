import valibot from 'eslint-plugin-valibot';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  ...valibot.flatConfigs.strict,
];
