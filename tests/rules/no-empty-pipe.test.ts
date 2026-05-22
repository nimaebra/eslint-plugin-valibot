import { RuleTester } from 'eslint';

import { noEmptyPipe } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-empty-pipe', noEmptyPipe as never, {
  valid: [
    {
      code: "import { pipe, string, minLength } from 'valibot';\nconst Schema = pipe(string(), minLength(5));",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(5));",
    },
    {
      code: "import { pipe } from 'some-other-library';\nconst Schema = pipe();",
    },
  ],
  invalid: [
    {
      code: "import { pipe } from 'valibot';\nconst Schema = pipe();",
      errors: [
        {
          messageId: 'emptyPipe',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe();",
      errors: [
        {
          messageId: 'emptyPipe',
        },
      ],
    },
    {
      code: "import { pipe, string } from 'valibot';\nconst Schema = pipe(string());",
      output: "import { pipe, string } from 'valibot';\nconst Schema = string();",
      errors: [
        {
          messageId: 'redundantPipe',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string());",
      output: "import * as v from 'valibot';\nconst Schema = v.string();",
      errors: [
        {
          messageId: 'redundantPipe',
        },
      ],
    },
  ],
});
