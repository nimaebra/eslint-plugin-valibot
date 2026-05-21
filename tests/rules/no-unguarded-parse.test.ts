import { RuleTester } from 'eslint';

import { noUnguardedParse } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-unguarded-parse', noUnguardedParse as never, {
  valid: [
    {
      code: "import { parse, string } from 'valibot';\ntry {\n  const value = parse(string(), input);\n  console.log(value);\n} catch (error) {\n  console.error(error);\n}",
    },
    {
      code: "import * as v from 'valibot';\ntry {\n  v.assert(v.string(), input);\n} catch (error) {\n  console.error(error);\n}",
    },
    {
      code: "import { parse } from 'other-library';\nconst value = parse(schema, input);",
    },
  ],
  invalid: [
    {
      code: "import { parse, string } from 'valibot';\nconst value = parse(string(), input);",
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: { functionName: 'parse' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nfunction validate(input) {\n  return v.parse(v.string(), input);\n}",
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: { functionName: 'parse' },
        },
      ],
    },
    {
      code: "const { assert, string } = require('valibot');\nassert(string(), input);",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: { functionName: 'assert' },
        },
      ],
    },
  ],
});
