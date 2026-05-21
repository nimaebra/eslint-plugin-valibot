import { RuleTester } from 'eslint';

import { requireSafeParseSuccessCheck } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run(
  'require-safe-parse-success-check',
  requireSafeParseSuccessCheck as never,
  {
    valid: [
      {
        code: "import * as v from 'valibot';\nconst result = v.safeParse(v.string(), input);\nif (result.success) {\n  console.log(result.output.length);\n} else {\n  console.log(result.issues);\n}",
      },
      {
        code: "import { safeParse, string } from 'valibot';\nconst result = safeParse(string(), input);\nconst value = result.success ? result.output : 'fallback';",
      },
      {
        code: "import { safeParse, string } from 'valibot';\nconst result = safeParse(string(), input);\nif (isReady && result.success) {\n  console.log(result.output.length);\n}",
      },
      {
        code: "import { safeParse, string } from 'valibot';\nconst result = safeParse(string(), input);\nif (result.success) {\n  const { output } = result;\n  console.log(output.length);\n}",
      },
      {
        code: "import { safeParse, string } from 'valibot';\nconst result = safeParse(string(), input);\nswitch (result.success) {\n  case true:\n    console.log(result.output.length);\n    break;\n  case false:\n    console.log(result.issues);\n    break;\n}",
      },
      {
        code: "import { safeParse, string } from 'other-library';\nconst result = safeParse(string(), input);\nconsole.log(result.output);",
      },
    ],
    invalid: [
      {
        code: "import * as v from 'valibot';\nconst result = v.safeParse(v.string(), input);\nconsole.log(result.output.length);",
        errors: [
          {
            messageId: 'missingSuccessCheck',
            data: { propertyName: 'output' },
          },
        ],
      },
      {
        code: "import { safeParse, string } from 'valibot';\nconst result = safeParse(string(), input);\nconsole.log(result.issues);",
        errors: [
          {
            messageId: 'missingSuccessCheck',
            data: { propertyName: 'issues' },
          },
        ],
      },
      {
        code: "import { safeParse, string } from 'valibot';\nconsole.log(safeParse(string(), input).output);",
        errors: [
          {
            messageId: 'missingSuccessCheck',
            data: { propertyName: 'output' },
          },
        ],
      },
      {
        code: "import { safeParse, string } from 'valibot';\nconst result = safeParse(string(), input);\nconst { output } = result;\nconsole.log(output.length);",
        errors: [
          {
            messageId: 'missingSuccessCheck',
            data: { propertyName: 'output' },
          },
        ],
      },
      {
        code: "import { safeParse, string } from 'valibot';\nconst result = safeParse(string(), input);\nif (result.success && isReady) {\n  console.log(result.issues);\n}",
        errors: [
          {
            messageId: 'missingSuccessCheck',
            data: { propertyName: 'issues' },
          },
        ],
      },
      {
        code: "import { safeParse, string } from 'valibot';\nconst result = safeParse(string(), input);\nswitch (result.success) {\n  case true:\n    console.log(result.issues);\n    break;\n}",
        errors: [
          {
            messageId: 'missingSuccessCheck',
            data: { propertyName: 'issues' },
          },
        ],
      },
      {
        code: "const v = require('valibot');\nconst result = v.safeParse(v.string(), input);\nconst value = !result.success ? 'fallback' : result.issues;",
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'script',
        },
        errors: [
          {
            messageId: 'missingSuccessCheck',
            data: { propertyName: 'issues' },
          },
        ],
      },
    ],
  },
);
