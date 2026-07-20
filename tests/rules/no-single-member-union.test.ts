import { RuleTester } from 'eslint';

import { noSingleMemberUnion } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-single-member-union', noSingleMemberUnion as never, {
  valid: [
    {
      code: "import { union, string, number } from 'valibot';\nconst Schema = union([string(), number()]);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.number()]);",
    },
    {
      code: "import { union } from 'other-lib';\nconst Schema = union([string()]);",
    },
  ],
  invalid: [
    {
      code: "import { union, string } from 'valibot';\nconst Schema = union([string()]);",
      output:
        "import { union, string } from 'valibot';\nconst Schema = string();",
      errors: [
        {
          messageId: 'singleMemberUnion',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.string()]);",
      output: "import * as v from 'valibot';\nconst Schema = v.string();",
      errors: [
        {
          messageId: 'singleMemberUnion',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.object({ active: v.union([v.string()]) });",
      output:
        "import * as v from 'valibot';\nconst Schema = v.object({ active: v.string() });",
      errors: [
        {
          messageId: 'singleMemberUnion',
        },
      ],
    },
    {
      code: "const { union, string } = require('valibot');\nconst Schema = union([string()]);",
      output:
        "const { union, string } = require('valibot');\nconst Schema = string();",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'singleMemberUnion',
        },
      ],
    },
    {
      code: "import { union, string } from 'valibot';\nconst Schema = union([string()], 'Invalid value');",
      errors: [
        {
          messageId: 'singleMemberUnion',
        },
      ],
    },
    {
      code: "import { union } from 'valibot';\nconst Schema = union([condition ? FirstSchema : SecondSchema]);",
      output: null,
      errors: [
        {
          messageId: 'singleMemberUnion',
        },
      ],
    },
  ],
});
