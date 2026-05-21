import { RuleTester } from 'eslint';

import { noRedundantSchemaWrappers } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run(
  'no-redundant-schema-wrappers',
  noRedundantSchemaWrappers as never,
  {
    valid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.optional(v.string());",
      },
      {
        code: "import { optional, string } from 'valibot';\nconst Schema = optional(string());",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.optional(v.optional(v.string()), 'fallback');",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.optional(v.optional(v.string(), 'fallback'));",
      },
      {
        code: "const { optional, string } = require('valibot');\nconst Schema = optional(string());",
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'script',
        },
      },
    ],
    invalid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.optional(v.optional(v.string()));",
        output:
          "import * as v from 'valibot';\nconst Schema = v.optional(v.string());",
        errors: [{ messageId: 'redundantWrapper' }],
      },
      {
        code: "import { nullable, string } from 'valibot';\nconst Schema = nullable(nullable(string()));",
        output:
          "import { nullable, string } from 'valibot';\nconst Schema = nullable(string());",
        errors: [{ messageId: 'redundantWrapper' }],
      },
      {
        code: "const { nullish, string } = require('valibot');\nconst Schema = nullish(nullish(string()));",
        output:
          "const { nullish, string } = require('valibot');\nconst Schema = nullish(string());",
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'script',
        },
        errors: [{ messageId: 'redundantWrapper' }],
      },
    ],
  },
);
