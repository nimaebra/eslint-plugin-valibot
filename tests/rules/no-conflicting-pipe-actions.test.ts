import { RuleTester } from 'eslint';

import { noConflictingPipeActions } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run(
  'no-conflicting-pipe-actions',
  noConflictingPipeActions as never,
  {
    valid: [
      "import * as v from 'valibot'; v.pipe(v.string(), v.minLength(2), v.length(2), v.maxLength(2));",
      "import * as v from 'valibot'; v.pipe(v.set(v.number()), v.minSize(8), v.maxLength(3));",
      "import * as v from 'valibot'; v.pipe(v.set(v.number()), v.minSize(8), v.check(() => true), v.maxSize(3));",
      "import * as v from 'valibot'; v.pipe(v.number(), v.minValue(8), v.transform(() => 2), v.maxValue(3));",
      "import * as v from 'valibot'; v.pipe(v.number(), v.minValue(8), ...actions, v.maxValue(3));",
      {
        code: "import * as v from 'valibot'; v.pipe(v.string(), v.minLength(8), ...actions, v.maxLength(3));",
      },
      {
        code: "import * as v from 'valibot'; v.pipe(v.string(), v.minLength(8), v.trim(), v.maxLength(3));",
      },
      {
        code: "import * as v from 'valibot'; v.pipe(v.string(), v.minLength(8), v.customAction(), v.maxLength(3));",
      },
      {
        code: "import { pipe, string, minLength, maxLength } from 'valibot';\nconst Schema = pipe(string(), minLength(2), maxLength(10));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(5), v.maxLength(10));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(5), v.maxLength(5));",
      },
      {
        code: "import * as v from 'valibot';\nconst min = 10;\nconst Schema = v.pipe(v.string(), v.minLength(min), v.maxLength(5));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(10), v.transform(() => 'x'), v.maxLength(5));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(10), customAction, v.maxLength(5));",
      },
    ],
    invalid: [
      {
        code: "import * as v from 'valibot'; v.pipe(v.string(), v.length(2), v.length(3));",
        errors: [
          {
            messageId: 'conflictingPipeActions',
            data: {
              firstAction: 'length',
              firstValue: '3',
              secondAction: 'length',
              secondValue: '2',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot'; v.pipe(v.string(), v.minLength(5), v.length(3));",
        errors: [{ messageId: 'conflictingPipeActions' }],
      },
      {
        code: "import * as v from 'valibot'; v.pipeAsync(v.map(v.string(), v.number()), v.maxSize(3), v.size(8));",
        errors: [
          {
            messageId: 'conflictingPipeActions',
            data: {
              firstAction: 'size',
              firstValue: '8',
              secondAction: 'maxSize',
              secondValue: '3',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot'; v.pipe(v.set(v.number()), v.minSize(8), v.maxSize(3), v.maxSize(2));",
        errors: [{ messageId: 'conflictingPipeActions' }],
      },
      {
        code: "import * as v from 'valibot'; v.pipe(v.number(), v.maxValue(-5), v.minValue(-2));",
        errors: [
          {
            messageId: 'conflictingPipeActions',
            data: {
              firstAction: 'minValue',
              firstValue: '-2',
              secondAction: 'maxValue',
              secondValue: '-5',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot'; v.pipe(v.string(), v.minLength(8), v.email(), v.maxLength(3));",
        errors: [{ messageId: 'conflictingPipeActions' }],
      },
      {
        code: "import * as v from 'valibot'; v.pipeAsync(v.string(), v.minLength(8), v.regex(/x/), v.maxLength(3), v.maxLength(2));",
        errors: [{ messageId: 'conflictingPipeActions' }],
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipeAsync(v.string(), v.minLength(10), v.maxLength(5));",
        errors: [{ messageId: 'conflictingPipeActions' }],
      },
      {
        code: "import { pipe, string, minLength, maxLength } from 'valibot';\nconst Schema = pipe(string(), minLength(10), maxLength(5));",
        errors: [
          {
            messageId: 'conflictingPipeActions',
            data: {
              firstAction: 'minLength',
              firstValue: '10',
              secondAction: 'maxLength',
              secondValue: '5',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(8), v.maxLength(3));",
        errors: [
          {
            messageId: 'conflictingPipeActions',
            data: {
              firstAction: 'minLength',
              firstValue: '8',
              secondAction: 'maxLength',
              secondValue: '3',
            },
          },
        ],
      },
      {
        code: "const v = require('valibot');\nconst Schema = v.pipe(v.string(), v.maxLength(3), v.minLength(8));",
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'script',
        },
        errors: [
          {
            messageId: 'conflictingPipeActions',
            data: {
              firstAction: 'minLength',
              firstValue: '8',
              secondAction: 'maxLength',
              secondValue: '3',
            },
          },
        ],
      },
    ],
  },
);
