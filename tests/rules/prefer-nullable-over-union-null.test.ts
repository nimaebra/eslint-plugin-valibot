import { RuleTester } from 'eslint';

import { preferNullableOverUnionNull } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run(
  'prefer-nullable-over-union-null',
  preferNullableOverUnionNull as never,
  {
    valid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.nullable(v.string());",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.literal('')]);",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.null('Custom message')]);",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.null()], 'Custom message');",
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.object({ key: v.union([v.string(), v.null()]) });",
      },
    ],
    invalid: [
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.null()]);",
        output:
          "import * as v from 'valibot';\nconst Schema = v.nullable(v.string());",
        errors: [{ messageId: 'preferNullable' }],
      },
      {
        code: "import * as v from 'valibot';\nconst Schema = v.union([v.null(), v.string()]);",
        output:
          "import * as v from 'valibot';\nconst Schema = v.nullable(v.string());",
        errors: [{ messageId: 'preferNullable' }],
      },
      {
        code: "import { nullable, string, union, null as nullSchema } from 'valibot';\nconst Schema = union([string(), nullSchema()]);",
        output:
          "import { nullable, string, union, null as nullSchema } from 'valibot';\nconst Schema = nullable(string());",
        errors: [{ messageId: 'preferNullable' }],
      },
      {
        code: "import { string, union, null as nullSchema } from 'valibot';\nconst Schema = union([string(), nullSchema()]);",
        errors: [{ messageId: 'preferNullable' }],
      },
      {
        code: "const v = require('valibot');\nconst Schema = v.union([v.string(), v.null()]);",
        output:
          "const v = require('valibot');\nconst Schema = v.nullable(v.string());",
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'script',
        },
        errors: [{ messageId: 'preferNullable' }],
      },
    ],
  },
);
