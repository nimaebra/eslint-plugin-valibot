import { RuleTester } from 'eslint';

import { noSchemaAsPipeAction } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-schema-as-pipe-action', noSchemaAsPipeAction as never, {
  valid: [
    {
      code: "import { pipe, string, email, trim } from 'valibot';\nconst Schema = pipe(string(), email(), trim());",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.email(), v.trim());",
    },
    {
      code: "import { pipe } from 'some-other-library';\nconst Schema = pipe(email(), string());",
    },
  ],
  invalid: [
    {
      code: "import { pipe, string, number } from 'valibot';\nconst Schema = pipe(string(), number());",
      errors: [
        {
          messageId: 'noSchemaAsPipeAction',
          data: {
            name: 'number',
          },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.number());",
      errors: [
        {
          messageId: 'noSchemaAsPipeAction',
          data: {
            name: 'number',
          },
        },
      ],
    },
    {
      code: "import { pipe, string, email } from 'valibot';\nconst Schema = pipe(email(), string());",
      errors: [
        {
          messageId: 'actionAsFirstArgument',
          data: {
            name: 'email',
          },
        },
        {
          messageId: 'noSchemaAsPipeAction',
          data: {
            name: 'string',
          },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.email(), v.string());",
      errors: [
        {
          messageId: 'actionAsFirstArgument',
          data: {
            name: 'email',
          },
        },
        {
          messageId: 'noSchemaAsPipeAction',
          data: {
            name: 'string',
          },
        },
      ],
    },
  ],
});
