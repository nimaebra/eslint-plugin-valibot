import { RuleTester } from 'eslint';

import { noThrowInCheck } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-throw-in-check', noThrowInCheck as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.check((value) => value.length > 0, 'Required'));",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.rawCheck(({ dataset, addIssue }) => {\n  if (dataset.value === '') addIssue({ message: 'Required' });\n}));",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((value) => {\n  try {\n    if (!value) throw new Error('caught below');\n    return value;\n  } catch {\n    return '';\n  }\n}));",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.check((value) => {\n  try {\n    assertValid(value);\n    return true;\n  } catch {\n    return false;\n  }\n}));",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.check((value) => {\n  const helper = () => {\n    throw new Error('nested helper');\n  };\n  return safely(helper);\n}));",
    },
    {
      code: "import * as v from 'valibot';\nfunction validate(value) {\n  throw new Error('outside any Valibot callback');\n}",
    },
    {
      code: "import { check } from 'other-library';\nconst action = check(() => {\n  throw new Error('not valibot');\n});",
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((value) => {\n  try {\n    return JSON.parse(value);\n  } catch {\n    throw new Error('rethrow escapes');\n  }\n}));",
      errors: [{ messageId: 'throwInCallback', data: { name: 'transform' } }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.check((value) => {\n  if (!value) throw new Error('Required');\n  return true;\n}));",
      errors: [{ messageId: 'throwInCallback', data: { name: 'check' } }],
    },
    {
      code: "import { pipe, string, transform } from 'valibot';\nconst Schema = pipe(string(), transform((value) => {\n  throw new TypeError('bad');\n}));",
      errors: [{ messageId: 'throwInCallback', data: { name: 'transform' } }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.rawTransform(({ dataset }) => {\n  throw new Error('bad');\n}));",
      errors: [
        { messageId: 'throwInRawCallback', data: { name: 'rawTransform' } },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipe(\n  v.object({ password: v.string(), confirm: v.string() }),\n  v.partialCheck([['password'], ['confirm']], (input) => {\n    throw new Error('mismatch');\n  }),\n);",
      errors: [
        { messageId: 'throwInCallback', data: { name: 'partialCheck' } },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.pipeAsync(v.string(), v.checkAsync(async function (value) {\n  throw new Error('bad');\n}));",
      errors: [{ messageId: 'throwInCallback', data: { name: 'checkAsync' } }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.custom((input) => {\n  try {\n    return typeof input === 'string';\n  } finally {\n    throw new Error('finally escapes');\n  }\n});",
      errors: [{ messageId: 'throwInCallback', data: { name: 'custom' } }],
    },
  ],
});
