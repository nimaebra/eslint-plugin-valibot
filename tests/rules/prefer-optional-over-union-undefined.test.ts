import { RuleTester } from 'eslint';

import { preferOptionalOverUnionUndefined } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run(
  'prefer-optional-over-union-undefined',
  preferOptionalOverUnionUndefined as never,
  {
    valid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.optional(v.string());",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.literal('')]);",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.undefined('Custom message')]);",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.undefined()], 'Custom message');",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.object({ key: v.union([v.string(), v.undefined()]) });",
      },
    ],
    invalid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.undefined()]);",
        output:
          "import * as v from 'valibot';\nconst Schema = v.optional(v.string());",
        errors: [{ messageId: 'preferOptional' }],
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.undefined(), v.string()]);",
        output:
          "import * as v from 'valibot';\nconst Schema = v.optional(v.string());",
        errors: [{ messageId: 'preferOptional' }],
      },
      {
        code: "import { optional, string, union, undefined as undefinedSchema } from 'valibot';\nconst Schema = union([string(), undefinedSchema()]);",
        output:
          "import { optional, string, union, undefined as undefinedSchema } from 'valibot';\nconst Schema = optional(string());",
        errors: [{ messageId: 'preferOptional' }],
      },
      {
        code: "import { string, union, undefined as undefinedSchema } from 'valibot';\nconst Schema = union([string(), undefinedSchema()]);",
        errors: [{ messageId: 'preferOptional' }],
      },
      {
        code: "const v = require('valibot');\nconst Schema = v.union([v.string(), v.undefined()]);",
        output:
          "const v = require('valibot');\nconst Schema = v.optional(v.string());",
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'script',
        },
        errors: [{ messageId: 'preferOptional' }],
      },
    ],
  },
);
