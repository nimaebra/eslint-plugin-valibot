import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tseslint from 'typescript-eslint';
import valibot from 'eslint-plugin-valibot';

const exampleDir = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: exampleDir,
      },
    },
  },
  ...tseslint.configs.recommended,
  ...valibot.flatConfigs.strict,
);
