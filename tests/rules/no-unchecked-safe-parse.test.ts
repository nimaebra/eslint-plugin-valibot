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
    // Unawaited promises belong to no-unawaited-parse-async.
    {
      code: `${NS}const promise = v.safeParseAsync(Schema, input); save(promise.output);`,
    },
    {
      code: `${NS}save(v.safeParse(Schema, input));`,
    },
    // Rest bindings can retain success, so destructuring alone is inconclusive.
    {
      code: `${NS}const { output, ...rest } = v.safeParse(Schema, input);`,
    },
    {
      code: `${NS}const { ['success']: ok, output: value } = v.safeParse(Schema, input);`,
    },
    {
      code: `${NS}const { [key]: value } = v.safeParse(Schema, input);`,
    },
    // Mutable and non-object bindings are intentionally not tracked.
    {
      code: `${NS}let result = v.safeParse(Schema, input); result = other; save(result.output);`,
    },
    {
      code: `${NS}const [first] = v.safeParse(Schema, input);`,
    },
    {
      code: `${NS}switch (mode) { case 'save': { const result = v.safeParse(Schema, input); if (!result.success) break; save(result.output); } }`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); switch (mode) { case 'save': if (!result.success) break; save(result.output); }`,
    },
    {
      code: `${NS}class Cache { static { const result = v.safeParse(Schema, input); if (!result.success) throw new Error('invalid'); save(result.output); } }`,
    },
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
      code: `${NS}const { ['output']: value } = v.safeParse(Schema, input);`,
      errors: [error()],
    },
    {
      code: `${NS}async function handle() { return (await v.safeParseAsync(Schema, input)).output; }`,
      errors: [error('safeParseAsync')],
    },
    // A guard for a different result cannot validate this result.
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (other.success) save(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (result.success === enabled) save(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (result.success > false) save(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (enabled) {} else save(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (!result.success) {} save(result.output);`,
      errors: [error()],
    },
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
