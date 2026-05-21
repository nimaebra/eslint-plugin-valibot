import { RuleTester } from 'eslint';

import { schemaNameSuffix } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('schema-name-suffix', schemaNameSuffix as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst UserSchema = v.object({ id: v.string() });",
    },
    {
      code: "import * as v from 'valibot';\nexport const UserValidator = v.object({ id: v.string() });",
      options: [{ exportedOnly: false, suffix: 'Validator' }],
    },
    {
      code: "import * as v from 'valibot';\nconst User = v.object({ id: v.string() });",
      options: [{ exportedOnly: true }],
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nconst User = v.object({ id: v.string() });",
      errors: [
        {
          messageId: 'schemaNameSuffix',
          data: { suffix: 'Schema' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nexport const User = v.object({ id: v.string() });",
      options: [{ exportedOnly: true }],
      errors: [
        {
          messageId: 'schemaNameSuffix',
          data: { suffix: 'Schema' },
        },
      ],
    },
    {
      code: "const { object, string } = require('valibot');\nconst User = object({ id: string() });",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'schemaNameSuffix',
          data: { suffix: 'Schema' },
        },
      ],
    },
  ],
});
