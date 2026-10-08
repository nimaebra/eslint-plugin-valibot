import { RuleTester } from 'eslint';

import { noUnawaitedParseAsync } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

const NS = "import * as v from 'valibot';\n";

ruleTester.run('no-unawaited-parse-async', noUnawaitedParseAsync as never, {
  valid: [
    {
      code: `${NS}async function handle(input) {\n  const result = await v.safeParseAsync(Schema, input);\n  return result.success;\n}`,
    },
    {
      code: `${NS}function handle(input) {\n  return v.parseAsync(Schema, input);\n}`,
    },
    {
      code: `${NS}v.parseAsync(Schema, input).then(save).catch(report);`,
    },
    {
      code: `${NS}const results = await Promise.all(items.map((item) => v.safeParseAsync(Schema, item)));`,
    },
    {
      code: `${NS}void v.parseAsync(Schema, input).catch(report);`,
    },
    {
      code: `${NS}const pending = v.safeParseAsync(Schema, input);\nconst result = await pending;\nuse(result.success);`,
    },
    {
      code: "import { parseAsync } from 'other-library';\nparseAsync(Schema, input);",
    },
  ],
  invalid: [
    {
      code: `${NS}async function handle(input) {\n  v.parseAsync(Schema, input);\n}`,
      errors: [
        {
          messageId: 'floatingPromise',
          data: { name: 'parseAsync' },
          suggestions: [
            {
              messageId: 'addAwait',
              data: { name: 'parseAsync' },
              output: `${NS}async function handle(input) {\n  await v.parseAsync(Schema, input);\n}`,
            },
          ],
        },
      ],
    },
    {
      code: `${NS}function handle(input) {\n  v.parseAsync(Schema, input);\n}`,
      errors: [
        {
          messageId: 'floatingPromise',
          data: { name: 'parseAsync' },
          suggestions: [],
        },
      ],
    },
    {
      code: `${NS}if (v.safeParseAsync(Schema, input).success) save(input);`,
      errors: [
        {
          messageId: 'propertyOnPromise',
          data: { name: 'safeParseAsync', property: 'success' },
          suggestions: [
            {
              messageId: 'addAwait',
              data: { name: 'safeParseAsync' },
              output: `${NS}if ((await v.safeParseAsync(Schema, input)).success) save(input);`,
            },
          ],
        },
      ],
    },
    {
      code: `${NS}async function handle(input) {\n  const result = v.safeParseAsync(Schema, input);\n  if (!result.success) return result.issues;\n  return result.output;\n}`,
      errors: ['success', 'issues', 'output'].map((property) => ({
        messageId: 'propertyOnPromise',
        data: { name: 'safeParseAsync', property },
        suggestions: [
          {
            messageId: 'addAwait',
            data: { name: 'safeParseAsync' },
            output: `${NS}async function handle(input) {\n  const result = await v.safeParseAsync(Schema, input);\n  if (!result.success) return result.issues;\n  return result.output;\n}`,
          },
        ],
      })),
    },
    {
      code: `${NS}async function handle(input) {\n  const { success, output } = v.safeParseAsync(Schema, input);\n  return success ? output : null;\n}`,
      errors: [
        {
          messageId: 'propertyOnPromise',
          data: { name: 'safeParseAsync', property: 'success' },
          suggestions: [
            {
              messageId: 'addAwait',
              data: { name: 'safeParseAsync' },
              output: `${NS}async function handle(input) {\n  const { success, output } = await v.safeParseAsync(Schema, input);\n  return success ? output : null;\n}`,
            },
          ],
        },
      ],
    },
    {
      code: `${NS}async function handle(input) {\n  const user = v.parseAsync(UserSchema, input);\n  return user.name;\n}`,
      errors: [
        {
          messageId: 'propertyOnPromise',
          data: { name: 'parseAsync', property: 'name' },
          suggestions: [
            {
              messageId: 'addAwait',
              data: { name: 'parseAsync' },
              output: `${NS}async function handle(input) {\n  const user = await v.parseAsync(UserSchema, input);\n  return user.name;\n}`,
            },
          ],
        },
      ],
    },
  ],
});
