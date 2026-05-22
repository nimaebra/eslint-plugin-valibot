import { RuleTester } from 'eslint';

import { noUnknownSchema } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-unknown-schema', noUnknownSchema as never, {
  valid: [
    {
      code: "import { string } from 'valibot';\nconst Schema = string();",
    },
    {
      code: "import { unknown } from 'some-other-library';\nconst value = unknown();",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.string();",
    },
    {
      code: "const { string } = require('valibot');\nconst Schema = string();",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
    },
  ],
  invalid: [
    {
      code: "import { unknown } from 'valibot';\nconst Schema = unknown();",
      errors: [
        {
          messageId: 'avoidUnknownSchema',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.unknown();",
      errors: [
        {
          messageId: 'avoidUnknownSchema',
        },
      ],
    },
    {
      code: "const { unknown } = require('valibot');\nconst Schema = unknown();",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'avoidUnknownSchema',
        },
      ],
    },
  ],
});
