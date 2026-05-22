import { RuleTester } from 'eslint';

import { noLooseObject } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-loose-object', noLooseObject as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.object({ id: v.string() });",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.strictObject({ id: v.string() });",
    },
    {
      code: "import { looseObject, string } from 'valibot';\nconst Schema = looseObject({ id: string() });",
      options: [{ allow: ['looseObject', 'strictObject'] }],
    },
    {
      code: "import { object, string } from 'other-library';\nconst Schema = object({ id: string() });",
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.looseObject({ id: v.string() });",
      errors: [
        {
          messageId: 'disallowedObjectSchemaType',
          data: {
            disallowedType: 'looseObject',
            allowedTypes: 'object(), strictObject()',
          },
        },
      ],
    },
    {
      code: "import { strictObject, string } from 'valibot';\nconst Schema = strictObject({ id: string() });",
      options: [{ allow: ['object'] }],
      errors: [
        {
          messageId: 'disallowedObjectSchemaType',
          data: {
            disallowedType: 'strictObject',
            allowedTypes: 'object()',
          },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.object({ id: v.string() });",
      options: [{ allow: ['looseObject', 'strictObject'] }],
      errors: [
        {
          messageId: 'disallowedObjectSchemaType',
          data: {
            disallowedType: 'object',
            allowedTypes: 'looseObject(), strictObject()',
          },
        },
      ],
    },
    {
      code: "const { looseObject, string } = require('valibot');\nconst Schema = looseObject({ id: string() });",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'disallowedObjectSchemaType',
          data: {
            disallowedType: 'looseObject',
            allowedTypes: 'object(), strictObject()',
          },
        },
      ],
    },
  ],
});
