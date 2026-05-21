import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import { noSchemaAsType } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    parser: tseslint.parser,
    sourceType: 'module',
  },
});

ruleTester.run('no-schema-as-type', noSchemaAsType as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst UserSchema = v.object({ id: v.string() });\ntype User = v.InferOutput<typeof UserSchema>;",
    },
    {
      code: "import { object, string, type InferInput } from 'valibot';\nconst UserSchema = object({ id: string() });\ntype User = InferInput<typeof UserSchema>;",
    },
    {
      code: 'const UserSchema = createSchema();\ntype User = typeof UserSchema;',
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nconst UserSchema = v.object({ id: v.string() });\ntype User = typeof UserSchema;",
      errors: [
        {
          messageId: 'noSchemaAsType',
          data: { schemaName: 'UserSchema' },
        },
      ],
    },
    {
      code: "import { object, string } from 'valibot';\nconst UserSchema = object({ id: string() });\ninterface Wrapper {\n  user: typeof UserSchema;\n}",
      errors: [
        {
          messageId: 'noSchemaAsType',
          data: { schemaName: 'UserSchema' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst UserSchema = v.object({ id: v.string() });\nconst user = {} as typeof UserSchema;",
      errors: [
        {
          messageId: 'noSchemaAsType',
          data: { schemaName: 'UserSchema' },
        },
      ],
    },
  ],
});
