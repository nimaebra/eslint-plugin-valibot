import { RuleTester } from 'eslint';

import { noRecreatedSchemas } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-recreated-schemas', noRecreatedSchemas as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst UserSchema = v.object({ name: v.string() });\nexport { UserSchema };",
    },
    {
      code: "import * as v from 'valibot';\nfunction createSchema(name) {\n  const UserSchema = v.object({ name: v.literal(name) });\n  return UserSchema;\n}",
    },
    {
      code: "import * as v from 'valibot';\nfunction createSchema() {\n  const UserSchema = v.pipe(v.string(), v.transform((input) => input.trim()));\n  return UserSchema;\n}",
    },
    {
      code: "import * as v from 'valibot';\nfunction createSchema(name) {\n  return v.object({ name: v.literal(name) });\n}",
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nfunction validate(input) {\n  const UserSchema = v.object({ name: v.string() });\n  return v.safeParse(UserSchema, input);\n}",
      errors: [{ messageId: 'noRecreatedSchema' }],
    },
    {
      code: "import { optional, string } from 'valibot';\nconst validate = (input) => {\n  const ValueSchema = optional(string());\n  return [ValueSchema, input];\n};",
      errors: [{ messageId: 'noRecreatedSchema' }],
    },
    {
      code: "import * as v from 'valibot';\nfunction createSchema() {\n  return v.object({ name: v.string() });\n}",
      errors: [{ messageId: 'noRecreatedSchema' }],
    },
    {
      code: "import { optional, string } from 'valibot';\nconst createSchema = () => optional(string());",
      errors: [{ messageId: 'noRecreatedSchema' }],
    },
  ],
});
