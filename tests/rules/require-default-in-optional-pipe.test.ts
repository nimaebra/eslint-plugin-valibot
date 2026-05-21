import { RuleTester } from 'eslint';

import { requireDefaultInOptionalPipe } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run(
  'require-default-in-optional-pipe',
  requireDefaultInOptionalPipe as never,
  {
    valid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.optional(v.string()), v.transform(Boolean));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.object({ active: v.pipe(v.optional(v.string(), 'false'), v.transform((value) => value === 'true')) });",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.object({ active: v.pipe(v.nullable(v.string()), v.transform(Boolean)) });",
      },
      {
        code: "import { object, pipe, optional, string, transform } from 'other-library';\nconst Schema = object({ active: pipe(optional(string()), transform(Boolean)) });",
      },
    ],
    invalid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.object({ active: v.pipe(v.optional(v.string()), v.transform((value) => value === 'true')) });",
        errors: [
          {
            messageId: 'missingDefault',
            data: { wrapperName: 'optional' },
          },
        ],
      },
      {
        code: "import { object, pipe, nullish, string, transform } from 'valibot';\nconst Schema = object({ active: pipe(nullish(string()), transform(Boolean)) });",
        errors: [
          {
            messageId: 'missingDefault',
            data: { wrapperName: 'nullish' },
          },
        ],
      },
      {
        code: "const v = require('valibot');\nconst Schema = v.strictObject({ active: v.pipe(v.optional(v.string()), v.transform(Boolean)) });",
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'script',
        },
        errors: [
          {
            messageId: 'missingDefault',
            data: { wrapperName: 'optional' },
          },
        ],
      },
    ],
  },
);
