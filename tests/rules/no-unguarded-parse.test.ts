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
      code: "import * as v from 'valibot';\nasync function load(input) {\n  try {\n    return await v.parseAsync(Schema, input);\n  } catch (error) {\n    return null;\n  }\n}",
    },
    {
      code: "import * as v from 'valibot';\nconst promise = v.parseAsync(Schema, input).catch(() => null);",
    },
    {
      code: "import * as v from 'valibot';\nconst promise = v.parseAsync(Schema, input).then((value) => value, () => null);",
    },
    {
      code: "import * as v from 'valibot';\nconst env = v.parse(EnvSchema, process.env);",
      options: [{ allowAtModuleScope: true }],
    },
    {
      code: "import * as v from 'valibot';\nexport async function action({ request }) {\n  const data = v.parse(Schema, await request.json());\n  return data;\n}",
      options: [{ allowInFunctions: ['action'] }],
    },
    {
      code: "import * as v from 'valibot';\nexport const loader = async () => {\n  return items.map((item) => v.parse(Schema, item));\n};",
      options: [{ allowInFunctions: ['loader'] }],
    },
    {
      code: "import * as v from 'valibot';\nconst handlers = {\n  submit(input) {\n    return v.parse(Schema, input);\n  },\n};",
      options: [{ allowInFunctions: ['submit'] }],
    },
    {
      code: "import * as v from 'valibot';\nconst value = v.assert(Schema, input);",
      options: [{ functions: ['parse', 'parseAsync'] }],
    },
    {
      code: "import * as v from 'valibot';\nconst value = v.parseAsync(Schema, input);",
      options: [{ functions: ['parse', 'assert'] }],
    },
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
      code: "import * as v from 'valibot';\nconst promise = v.parseAsync(Schema, input);",
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: {
            functionName: 'parseAsync',
            safeFunctionName: 'safeParseAsync',
          },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst promise = v.parseAsync(Schema, input).then((value) => value);",
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: {
            functionName: 'parseAsync',
            safeFunctionName: 'safeParseAsync',
          },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\ntry {\n  v.parse(Schema, input);\n} finally {\n  cleanup();\n}",
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: { functionName: 'parse', safeFunctionName: 'safeParse' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nfunction validate(input) {\n  return v.parse(Schema, input);\n}",
      options: [{ allowAtModuleScope: true }],
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: { functionName: 'parse', safeFunctionName: 'safeParse' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nfunction helper(input) {\n  return v.parse(Schema, input);\n}",
      options: [{ allowInFunctions: ['action'] }],
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: { functionName: 'parse', safeFunctionName: 'safeParse' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst value = v.parse(Schema, input);",
      options: [{ allowInFunctions: ['action'] }],
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: { functionName: 'parse', safeFunctionName: 'safeParse' },
        },
      ],
    },
    {
      code: "import { parse, string } from 'valibot';\nconst value = parse(string(), input);",
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: { functionName: 'parse', safeFunctionName: 'safeParse' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nfunction validate(input) {\n  return v.parse(v.string(), input);\n}",
      errors: [
        {
          messageId: 'unguardedParserCall',
          data: { functionName: 'parse', safeFunctionName: 'safeParse' },
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
          data: { functionName: 'assert', safeFunctionName: 'is' },
        },
      ],
    },
  ],
});
