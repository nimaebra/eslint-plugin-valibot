import { RuleTester } from 'eslint';

import { noTransformInRecordKey } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-transform-in-record-key', noTransformInRecordKey as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.record(v.string(), v.string());",
    },
    {
      code: "import { record, pipe, string, minLength } from 'valibot';\nconst Schema = record(pipe(string(), minLength(1)), string());",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.record(v.string(), v.pipe(v.string(), v.trim()));",
    },
    {
      code: "import * as v from 'valibot';\nconst KeySchema = v.pipe(v.string(), v.minLength(1));\nconst Schema = v.record(KeySchema, v.string());",
    },
    {
      code: "import * as v from 'other-library';\nconst Schema = v.record(v.pipe(v.string(), v.trim()), v.string());",
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.record(v.pipe(v.string(), v.trim()), v.string());",
      errors: [
        {
          messageId: 'transformInRecordKey',
          data: { actionName: 'trim' },
        },
      ],
    },
    {
      code: "import { record, pipe, string, toLowerCase, unknown } from 'valibot';\nconst Schema = record(pipe(string(), toLowerCase()), unknown());",
      errors: [
        {
          messageId: 'transformInRecordKey',
          data: { actionName: 'toLowerCase' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst KeySchema = v.pipe(v.string(), v.trim());\nconst Schema = v.record(KeySchema, v.string());",
      errors: [
        {
          messageId: 'transformInRecordKey',
          data: { actionName: 'trim' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.record(v.message(v.pipe(v.string(), v.transform((input) => input.trim())), 'key'), v.string());",
      errors: [
        {
          messageId: 'transformInRecordKey',
          data: { actionName: 'transform' },
        },
      ],
    },
    {
      code: "const { record, pipe, string, trim, toUpperCase } = require('valibot');\nconst Schema = record(pipe(string(), trim(), toUpperCase()), string());",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'transformInRecordKey',
          data: { actionName: 'trim' },
        },
        {
          messageId: 'transformInRecordKey',
          data: { actionName: 'toUpperCase' },
        },
      ],
    },
  ],
});
