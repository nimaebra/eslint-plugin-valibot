import { RuleTester } from 'eslint';

import { preferNullish } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-nullish', preferNullish as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.nullish(v.string());",
    },
    {
      code: "import { optional, nullable, string } from 'valibot';\nconst Schema = optional(nullable(string()), 'fallback');",
    },
    {
      code: "import { optional, nullable, string } from 'other-library';\nconst Schema = optional(nullable(string()));",
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.optional(v.nullable(v.string()));",
      output:
        "import * as v from 'valibot';\nconst Schema = v.nullish(v.string());",
      errors: [{ messageId: 'preferNullish' }],
    },
    {
      code: "import { optional, nullable, nullish, string } from 'valibot';\nconst Schema = optional(nullable(string()));",
      output:
        "import { optional, nullable, nullish, string } from 'valibot';\nconst Schema = nullish(string());",
      errors: [{ messageId: 'preferNullish' }],
    },
    {
      code: "import { optional, nullable, string } from 'valibot';\nconst Schema = nullable(optional(string()));",
      errors: [{ messageId: 'preferNullish' }],
    },
    {
      code: "const v = require('valibot');\nconst Schema = v.optional(v.nullable(v.string()));",
      output:
        "const v = require('valibot');\nconst Schema = v.nullish(v.string());",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [{ messageId: 'preferNullish' }],
    },
  ],
});
