import { RuleTester } from 'eslint';

import { noUncheckedSafeParse } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

const NS = "import * as v from 'valibot';\n";
const error = (name = 'safeParse') => ({
  messageId: 'uncheckedOutput',
  data: { name },
});

ruleTester.run('no-unchecked-safe-parse', noUncheckedSafeParse as never, {
  valid: [
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nif (result.success) {\n  save(result.output);\n}`,
    },
    {
      code: `${NS}function handle(input) {\n  const result = v.safeParse(Schema, input);\n  if (!result.success) {\n    return null;\n  }\n  return result.output;\n}`,
    },
    {
      code: `${NS}function handle(input) {\n  const result = v.safeParse(Schema, input);\n  if (!result.success || isDisabled()) throw new Error('invalid');\n  return result.output;\n}`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nconst value = result.success ? result.output : fallback;`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nconst value = !result.success ? fallback : result.output;`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nconst value = result.success && result.output.name;`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nif (result.success === false) {\n  report(result.issues);\n} else {\n  save(result.output);\n}`,
    },
    {
      code: `${NS}async function handle(input) {\n  const result = await v.safeParseAsync(Schema, input);\n  if (result.success) save(result.output);\n}`,
    },
    {
      code: `${NS}const { success, output } = v.safeParse(Schema, input);`,
    },
    {
      code: `${NS}for (const item of items) {\n  const result = v.safeParse(Schema, item);\n  if (!result.success) continue;\n  save(result.output);\n}`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nreport(result.issues);`,
    },
    {
      code: "import { safeParse } from 'other-library';\nconst value = safeParse(Schema, input).output;",
    },
  ],
  invalid: [
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nsave(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const value = v.safeParse(Schema, input).output;`,
      errors: [error()],
    },
    {
      code: `${NS}const { output } = v.safeParse(Schema, input);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nif (result.success) {\n  log('ok');\n}\nsave(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nif (!result.success) {\n  log(result.issues);\n}\nsave(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nconst value = result.success ? fallback : result.output;`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input);\nconst value = result.success || result.output;`,
      errors: [error()],
    },
    {
      code: `${NS}async function handle(input) {\n  const result = await v.safeParseAsync(Schema, input);\n  return result.output;\n}`,
      errors: [error('safeParseAsync')],
    },
    {
      code: `${NS}function handle(input) {\n  const result = v.safeParse(Schema, input);\n  if (!result.success && isStrict()) return null;\n  return result.output;\n}`,
      errors: [error()],
    },
  ],
});
