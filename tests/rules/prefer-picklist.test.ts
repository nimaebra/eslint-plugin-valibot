import { RuleTester } from 'eslint';

import { preferPicklist } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-picklist', preferPicklist as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.picklist(['A', 'B']);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.literal('A'), v.string()]);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.literal('A')]);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.literal(1), v.literal(2)]);",
    },
    {
      code: "import { union, literal } from 'other-library';\nconst Schema = union([literal('A'), literal('B')]);",
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.literal('A'), v.literal('B')]);",
      output:
        "import * as v from 'valibot';\nconst Schema = v.picklist(['A', 'B']);",
      errors: [{ messageId: 'preferPicklist' }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.literal('A'), v.literal('B')], 'Invalid');",
      output:
        "import * as v from 'valibot';\nconst Schema = v.picklist(['A', 'B'], 'Invalid');",
      errors: [{ messageId: 'preferPicklist' }],
    },
    {
      code: "import { union, literal, picklist } from 'valibot';\nconst Schema = union([literal('A'), literal('B')]);",
      output:
        "import { union, literal, picklist } from 'valibot';\nconst Schema = picklist(['A', 'B']);",
      errors: [{ messageId: 'preferPicklist' }],
    },
    {
      code: "import { union, literal } from 'valibot';\nconst Schema = union([literal('A'), literal('B')]);",
      errors: [{ messageId: 'preferPicklist' }],
    },
    {
      code: "const v = require('valibot');\nconst Schema = v.union([v.literal('A'), v.literal('B')]);",
      output:
        "const v = require('valibot');\nconst Schema = v.picklist(['A', 'B']);",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [{ messageId: 'preferPicklist' }],
    },
  ],
});
