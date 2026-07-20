import { RuleTester } from 'eslint';

import { noEmptyUnion } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-empty-union', noEmptyUnion as never, {
  valid: [
    {
      code: "import { union, string, number } from 'valibot';\nconst Schema = union([string(), number()]);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.number()]);",
    },
    {
      code: "import { union } from 'other-lib';\nconst Schema = union([]);",
    },
    {
      code: "import { union, string } from 'valibot';\nconst Schema = union([string()]);",
    },
    {
      code: "import { union, string } from 'valibot';\nconst Schema = union([string()], 'Invalid value');",
    },
  ],
  invalid: [
    {
      code: "import { union } from 'valibot';\nconst Schema = union([]);",
      errors: [
        {
          messageId: 'emptyUnion',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([]);",
      errors: [
        {
          messageId: 'emptyUnion',
        },
      ],
    },
    {
      code: "import { union } from 'valibot';\nconst Schema = union();",
      errors: [
        {
          messageId: 'emptyUnion',
        },
      ],
    },
    {
      code: "const { union } = require('valibot');\nconst Schema = union([]);",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'emptyUnion',
        },
      ],
    },
    {
      code: "import { union } from 'valibot';\nconst Schema = union([,,]);",
      errors: [
        {
          messageId: 'emptyUnion',
        },
      ],
    },
    {
      code: "import { union } from 'valibot';\nconst Schema = union([], 'Invalid value');",
      errors: [
        {
          messageId: 'emptyUnion',
        },
      ],
    },
  ],
});
