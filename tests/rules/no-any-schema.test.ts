import { RuleTester } from 'eslint';

import { noAnySchema } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-any-schema', noAnySchema as never, {
  valid: [
    {
      code: "import { unknown } from 'valibot';\nconst Schema = unknown();",
    },
    {
      code: "import { any } from 'some-other-library';\nconst value = any();",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.unknown();",
    },
    {
      code: "const { unknown } = require('valibot');\nconst Schema = unknown();",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
    },
  ],
  invalid: [
    {
      code: "import { any } from 'valibot';\nconst Schema = any();",
      errors: [
        {
          messageId: 'avoidAnySchema',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.any();",
      errors: [
        {
          messageId: 'avoidAnySchema',
        },
      ],
    },
    {
      code: "const { any } = require('valibot');\nconst Schema = any();",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'avoidAnySchema',
        },
      ],
    },
  ],
});
