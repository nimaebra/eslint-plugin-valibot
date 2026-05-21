import { RuleTester } from 'eslint';

import { preferNamedSchema } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-named-schema', preferNamedSchema as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst UserSchema = v.object({ name: v.string() });\nv.safeParse(UserSchema, input);",
    },
    {
      code: "import { parse } from 'valibot';\nparse(getSchema(), input);",
    },
    {
      code: "import { parse } from 'other-library';\nparse(schema(), input);",
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nconst value = v.parse(v.string(), input);",
      errors: [
        {
          messageId: 'preferNamedSchema',
          data: { functionName: 'parse' },
        },
      ],
    },
    {
      code: "import { safeParse, object, string } from 'valibot';\nconst result = safeParse(object({ name: string() }), input);",
      errors: [
        {
          messageId: 'preferNamedSchema',
          data: { functionName: 'safeParse' },
        },
      ],
    },
    {
      code: "const { assert, optional, string } = require('valibot');\nassert(optional(string()), input);",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'preferNamedSchema',
          data: { functionName: 'assert' },
        },
      ],
    },
  ],
});
