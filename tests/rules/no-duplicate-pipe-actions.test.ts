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
    ...[
      'v.transform(value => value * 2), v.transform(value => value * 2)',
      'v.transformAsync(async value => value * 2), v.transformAsync(async value => value * 2)',
      'v.check(predicate), v.check(predicate)',
      'v.checkAsync(predicate), v.checkAsync(predicate)',
      'v.regex(/a/g), v.regex(/a/g)',
      'v.minLength(nextLimit()), v.minLength(nextLimit())',
      'v.minLength(limit), v.minLength(limit)',
      'v.minLength(1, () => message()), v.minLength(1, () => message())',
      "v.trim(), v.transform(value => value + ' '), v.trim()",
      "v.minLength(1), v.transform(() => ''), v.minLength(1)",
      'v.trim(), customAction, v.trim()',
      'v.trim(), ...actions, v.trim()',
      'v.trim(), v.minLength(1), v.trim()',
    ].map((actions) => ({
      code: `import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), ${actions});`,
    })),
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
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim(), v.trim(), v.trim());",
      output:
        "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim(), v.trim());",
      errors: [
        { messageId: 'duplicatePipeAction' },
        { messageId: 'duplicatePipeAction' },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(1 /* keep */), v.minLength(1 /* keep */));",
      output: null,
      errors: [{ messageId: 'duplicatePipeAction' }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipeAsync(v.string(), v.trim(), v.trim(), v.minLength(1));",
      output:
        "import * as v from 'valibot';\nconst Schema = v.pipeAsync(v.string(), v.trim(), v.minLength(1));",
      errors: [{ messageId: 'duplicatePipeAction' }],
    },
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
