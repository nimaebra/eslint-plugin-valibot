import { RuleTester } from 'eslint';

import { noAsyncActionInSyncPipe } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run(
  'no-async-action-in-sync-pipe',
  noAsyncActionInSyncPipe as never,
  {
    valid: [
      {
        code: "import { pipe, string, minLength, transform } from 'valibot';\nconst Schema = pipe(string(), minLength(2), transform((v) => v.trim()));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.check((value) => value.length > 0));",
      },
      {
        code: "import { pipeAsync, string, checkAsync } from 'valibot';\nconst Schema = pipeAsync(string(), checkAsync(async (value) => isUnique(value)));",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipeAsync(v.string(), v.transformAsync(async (value) => value.trim()));",
      },
      {
        code: "import { pipe, string } from 'valibot';\nconst Schema = pipe(string(), customAction);",
      },
    ],
    invalid: [
      {
        code: "import { pipe, string, checkAsync } from 'valibot';\nconst Schema = pipe(string(), checkAsync(async (value) => isUnique(value)));",
        errors: [
          {
            messageId: 'asyncActionInSyncPipe',
            data: {
              actionName: 'checkAsync',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transformAsync(async (value) => value.trim()));",
        errors: [
          {
            messageId: 'asyncActionInSyncPipe',
            data: {
              actionName: 'transformAsync',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.array(v.string()), v.checkItemsAsync(async (items) => allUnique(items)));",
        errors: [
          {
            messageId: 'asyncActionInSyncPipe',
            data: {
              actionName: 'checkItemsAsync',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(2), v.rawTransformAsync(async ({ dataset }) => dataset));",
        errors: [
          {
            messageId: 'asyncActionInSyncPipe',
            data: {
              actionName: 'rawTransformAsync',
            },
          },
        ],
      },
      {
        code: "const v = require('valibot');\nconst Schema = v.pipe(v.string(), v.checkAsync(async (value) => isUnique(value)));",
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'script',
        },
        errors: [
          {
            messageId: 'asyncActionInSyncPipe',
            data: {
              actionName: 'checkAsync',
            },
          },
        ],
      },
    ],
  },
);
