import { RuleTester } from 'eslint';

import { preferFlattenPipe } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-flatten-pipe', preferFlattenPipe as never, {
  valid: [
    {
      code: "import { pipe, string, minLength } from 'valibot';\nconst Schema = pipe(string(), minLength(5));",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(5));",
    },
    {
      code: "import { pipe } from 'other-lib';\nconst Schema = pipe(pipe(string()), trim());",
    },
  ],
  invalid: [
    {
      code: "import { pipe, string, minLength, trim } from 'valibot';\nconst Schema = pipe(pipe(string(), minLength(5)), trim());",
      output:
        "import { pipe, string, minLength, trim } from 'valibot';\nconst Schema = pipe(string(), minLength(5), trim());",
      errors: [
        {
          messageId: 'nestedPipe',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.pipe(v.string(), v.minLength(5)), v.trim());",
      output:
        "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.minLength(5), v.trim());",
      errors: [
        {
          messageId: 'nestedPipe',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.pipe(v.string(), v.trim()), v.minLength(5));",
      output:
        "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim(), v.minLength(5));",
      errors: [
        {
          messageId: 'nestedPipe',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.pipe(v.string(), ...actions), v.minLength(5));",
      errors: [
        {
          messageId: 'nestedPipe',
        },
      ],
    },
    {
      code: "import { pipe as p, string, trim, minLength } from 'valibot';\nconst Schema = p(p(string(), trim()), minLength(5));",
      output:
        "import { pipe as p, string, trim, minLength } from 'valibot';\nconst Schema = p(string(), trim(), minLength(5));",
      errors: [
        {
          messageId: 'nestedPipe',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.pipe(v.string(), /* keep */ v.trim()), v.minLength(5));",
      output: null,
      errors: [
        {
          messageId: 'nestedPipe',
        },
      ],
    },
  ],
});
