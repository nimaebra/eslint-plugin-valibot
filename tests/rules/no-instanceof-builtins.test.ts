import { RuleTester } from 'eslint';

import { noInstanceofBuiltins } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-instanceof-builtins', noInstanceofBuiltins as never, {
  valid: [
    {
      code: "import { instance } from 'valibot';\nclass CustomClass {}\nconst Schema = instance(CustomClass);",
    },
    {
      code: "import * as v from 'valibot';\nclass CustomClass {}\nconst Schema = v.instance(CustomClass);",
    },
    {
      code: "import { date } from 'valibot';\nconst Schema = date();",
    },
    {
      code: "import { instance } from 'some-other-library';\nconst Schema = instance(Date);",
    },
    {
      code: "import * as v from 'valibot';\nclass Date {}\nconst Schema = v.instance(Date);",
    },
    {
      code: "import * as v from 'valibot';\nfunction schema(String) { return v.instance(String); }",
    },
    {
      code: "import * as v from 'valibot';\nimport { Date } from './custom.js';\nconst Schema = v.instance(Date);",
    },
  ],
  invalid: [
    ...[
      ['Date', 'date'],
      ['String', 'string'],
      ['Number', 'number'],
      ['Boolean', 'boolean'],
      ['Symbol', 'symbol'],
      ['BigInt', 'bigint'],
      ['Function', 'function'],
      ['Promise', 'promise'],
      ['Blob', 'blob'],
    ].map(([constructor, preferred]) => ({
      code: `import * as v from 'valibot';\nconst Schema = v.instance(${constructor});`,
      output: null,
      errors: [
        {
          messageId: 'noInstanceofBuiltins',
          data: { preferred, constructor },
          suggestions: [
            {
              messageId: 'replaceWithNativeSchema',
              data: { preferred },
              output: `import * as v from 'valibot';\nconst Schema = v.${preferred}();`,
            },
          ],
        },
      ],
    })),
    ...[
      ['Array', 'array'],
      ['Map', 'map'],
      ['Set', 'set'],
    ].map(([constructor, preferred]) => ({
      code: `import * as v from 'valibot';\nconst Schema = v.instance(${constructor});`,
      output: null,
      errors: [
        {
          messageId: 'noInstanceofBuiltins',
          data: { preferred, constructor },
          suggestions: [],
        },
      ],
    })),
    {
      code: "import { instance } from 'valibot';\nconst Schema = instance(Date);",
      output: null,
      errors: [{ messageId: 'noInstanceofBuiltins', suggestions: [] }],
    },
    {
      code: "import { instance, date as dateSchema } from 'valibot';\nconst Schema = instance(Date);",
      output: null,
      errors: [
        {
          messageId: 'noInstanceofBuiltins',
          suggestions: [
            {
              messageId: 'replaceWithNativeSchema',
              data: { preferred: 'date' },
              output:
                "import { instance, date as dateSchema } from 'valibot';\nconst Schema = dateSchema();",
            },
          ],
        },
      ],
    },
    {
      code: "import { instance, date } from 'valibot';\nfunction schema(date) { return instance(Date); }",
      output: null,
      errors: [{ messageId: 'noInstanceofBuiltins', suggestions: [] }],
    },
    {
      code: "const v = require('valibot');\nconst Schema = v.instance(Date);",
      output: null,
      errors: [
        {
          messageId: 'noInstanceofBuiltins',
          suggestions: [
            {
              messageId: 'replaceWithNativeSchema',
              data: { preferred: 'date' },
              output: "const v = require('valibot');\nconst Schema = v.date();",
            },
          ],
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.instance(/* keep */ Date);",
      output: null,
      errors: [{ messageId: 'noInstanceofBuiltins', suggestions: [] }],
    },
  ],
});
