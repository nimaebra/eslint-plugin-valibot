import { RuleTester } from 'eslint';

import { noLazyNonFunction } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-lazy-non-function', noLazyNonFunction as never, {
  valid: [
    {
      code: "import { lazy, string } from 'valibot';\nconst Schema = lazy(() => string());",
    },
    {
      code: "import { lazy, string } from 'valibot';\nfunction getMySchema() { return string(); }\nconst Schema = lazy(getMySchema);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.lazy(() => v.string());",
    },
    {
      code: "import { lazy } from 'some-other-library';\nconst Schema = lazy('not-a-function');",
    },
  ],
  invalid: [
    {
      code: "import { lazy, string } from 'valibot';\nconst Schema = lazy(string());",
      errors: [
        {
          messageId: 'noLazyNonFunction',
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.lazy(v.string());",
      errors: [
        {
          messageId: 'noLazyNonFunction',
        },
      ],
    },
    {
      code: "import { lazy } from 'valibot';\nconst Schema = lazy();",
      errors: [
        {
          messageId: 'noLazyNonFunction',
        },
      ],
    },
    {
      code: "import { lazy } from 'valibot';\nconst Schema = lazy('string');",
      errors: [
        {
          messageId: 'noLazyNonFunction',
        },
      ],
    },
    {
      code: "import { lazy } from 'valibot';\nconst Schema = lazy({});",
      errors: [
        {
          messageId: 'noLazyNonFunction',
        },
      ],
    },
  ],
});
