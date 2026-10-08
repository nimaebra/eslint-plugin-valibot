import { RuleTester } from 'eslint';

import { noLengthCheckBeforeTrim } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run(
  'no-length-check-before-trim',
  noLengthCheckBeforeTrim as never,
  {
    valid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim(), v.nonEmpty(), v.minLength(3));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.maxLength(1000), v.trim(), v.minLength(1));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(3));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.email(), v.trim());",
      },
      {
        code: "import { pipe, string, minLength, trim } from 'other-library';\nconst Schema = pipe(string(), minLength(1), trim());",
      },
    ],
    invalid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.nonEmpty(), v.trim());",
        errors: [
          {
            messageId: 'lengthCheckBeforeTrim',
            data: { check: 'nonEmpty', trim: 'trim' },
            suggestions: [
              {
                messageId: 'moveTrimBeforeCheck',
                data: { check: 'nonEmpty', trim: 'trim' },
                output:
                  "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim(), v.nonEmpty());",
              },
            ],
          },
        ],
      },
      {
        code: "import { minLength, pipe, string, trim } from 'valibot';\nconst Schema = pipe(\n  string(),\n  minLength(3, 'Too short'),\n  trim(),\n  maxLength(20),\n);",
        errors: [
          {
            messageId: 'lengthCheckBeforeTrim',
            data: { check: 'minLength', trim: 'trim' },
            suggestions: [
              {
                messageId: 'moveTrimBeforeCheck',
                data: { check: 'minLength', trim: 'trim' },
                output:
                  "import { minLength, pipe, string, trim } from 'valibot';\nconst Schema = pipe(\n  string(),\n  trim(), minLength(3, 'Too short'),\n  maxLength(20),\n);",
              },
            ],
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipeAsync(v.string(), v.nonEmpty(), v.minLength(3), v.trimEnd());",
        errors: [
          {
            messageId: 'lengthCheckBeforeTrim',
            data: { check: 'nonEmpty', trim: 'trimEnd' },
            suggestions: [
              {
                messageId: 'moveTrimBeforeCheck',
                data: { check: 'nonEmpty', trim: 'trimEnd' },
                output:
                  "import * as v from 'valibot';\nconst Schema = v.pipeAsync(v.string(), v.trimEnd(), v.nonEmpty(), v.minLength(3));",
              },
            ],
          },
          {
            messageId: 'lengthCheckBeforeTrim',
            data: { check: 'minLength', trim: 'trimEnd' },
            suggestions: [
              {
                messageId: 'moveTrimBeforeCheck',
                data: { check: 'nonEmpty', trim: 'trimEnd' },
                output:
                  "import * as v from 'valibot';\nconst Schema = v.pipeAsync(v.string(), v.trimEnd(), v.nonEmpty(), v.minLength(3));",
              },
            ],
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(\n  v.string(),\n  // must not be empty\n  v.nonEmpty(),\n  v.trim(),\n);",
        errors: [
          {
            messageId: 'lengthCheckBeforeTrim',
            suggestions: [],
          },
        ],
      },
    ],
  },
);
