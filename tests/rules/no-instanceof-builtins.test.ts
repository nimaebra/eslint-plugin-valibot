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
  ],
  invalid: [
    {
      code: "import { instance } from 'valibot';\nconst Schema = instance(Date);",
      output: "import { instance } from 'valibot';\nconst Schema = date();",
      errors: [
        {
          messageId: 'noInstanceofBuiltins',
          data: {
            preferred: 'date',
            constructor: 'Date',
          },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.instance(Date);",
      output: "import * as v from 'valibot';\nconst Schema = v.date();",
      errors: [
        {
          messageId: 'noInstanceofBuiltins',
          data: {
            preferred: 'date',
            constructor: 'Date',
          },
        },
      ],
    },
    {
      code: "import { instance, map as valibotMap } from 'valibot';\nconst Schema = instance(Map);",
      output: "import { instance, map as valibotMap } from 'valibot';\nconst Schema = valibotMap();",
      errors: [
        {
          messageId: 'noInstanceofBuiltins',
          data: {
            preferred: 'map',
            constructor: 'Map',
          },
        },
      ],
    },
    {
      code: "import { instance } from 'valibot';\nconst Schema = instance(Set);",
      output: "import { instance } from 'valibot';\nconst Schema = set();",
      errors: [
        {
          messageId: 'noInstanceofBuiltins',
          data: {
            preferred: 'set',
            constructor: 'Set',
          },
        },
      ],
    },
    {
      code: "import { instance } from 'valibot';\nconst Schema = instance(Array);",
      output: "import { instance } from 'valibot';\nconst Schema = array();",
      errors: [
        {
          messageId: 'noInstanceofBuiltins',
          data: {
            preferred: 'array',
            constructor: 'Array',
          },
        },
      ],
    },
  ],
});
