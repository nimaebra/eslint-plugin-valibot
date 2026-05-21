import { RuleTester } from 'eslint';

import { noDuplicatePipeActions } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-duplicate-pipe-actions', noDuplicatePipeActions as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim(), v.minLength(1));",
    },
    {
      code: "import { pipe, string, trim, minLength } from 'valibot';\nconst Schema = pipe(string(), trim(), minLength(1), minLength(2));",
    },
    {
      code: "import * as v from 'other-library';\nconst Schema = v.pipe(v.string(), v.trim(), v.trim());",
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim(), v.trim(), v.minLength(1));",
      output:
        "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim(), v.minLength(1));",
      errors: [
        {
          messageId: 'duplicatePipeAction',
          data: { actionName: 'trim' },
        },
      ],
    },
    {
      code: "import { pipe, string, minLength } from 'valibot';\nconst Schema = pipe(string(), minLength(1), minLength(1));",
      output:
        "import { pipe, string, minLength } from 'valibot';\nconst Schema = pipe(string(), minLength(1));",
      errors: [
        {
          messageId: 'duplicatePipeAction',
          data: { actionName: 'minLength' },
        },
      ],
    },
    {
      code: "const { pipe, string, trim } = require('valibot');\nconst Schema = pipe(string(), trim(), trim());",
      output:
        "const { pipe, string, trim } = require('valibot');\nconst Schema = pipe(string(), trim());",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'duplicatePipeAction',
          data: { actionName: 'trim' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim(), /* keep */ v.trim());",
      output: null,
      errors: [
        {
          messageId: 'duplicatePipeAction',
          data: { actionName: 'trim' },
        },
      ],
    },
  ],
});
