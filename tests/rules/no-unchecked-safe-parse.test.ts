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
      code: `${NS}const result = v.safeParse(v.string(), process.argv[2]);
if (!result.success) {
  process.exit(1);
}
console.log(result.output);`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (result.success) {} else process['exit'](1); save(result.output);`,
      languageOptions: { globals: { process: 'readonly' } },
    },
    {
      code: `${NS}import proc from 'node:process'; const result = v.safeParse(Schema, input); if (!result.success) proc.exit(1); save(result.output);`,
    },
    {
      code: `${NS}import * as proc from 'process'; const result = v.safeParse(Schema, input); if (!result.success) proc.exit(1); save(result.output);`,
    },
    {
      code: `${NS}function test() { const result = v.safeParse(Schema, input); if (!result.success) return; return () => result.output; }`,
    },

    {
      code: `${NS}const result = v.safeParse(Schema, input); if (result.success) { const { output } = result; save(output); }`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); result.extra = true; result[0] = true; if (result.success) save(result.output);`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (result.success) save(result.output); result.success = true;`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (!result.success) result.output = fallback; else save(result.output);`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); const { success, output } = result; result.output = fallback; if (success) save(output);`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); const { output, ...rest } = result; result.success = true; if (rest.success) save(output);`,
    },
    {
      code: `${NS}for (const item of items) { const result = v.safeParse(Schema, item); if (result.success) save(result.output); result.success = true; }`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (result['success']) save(result['output']);`,
    },
    {
      code: `${NS}let result = v.safeParse(Schema, input); if (!result['success']) throw Error(); save(result.output);`,
    },
    {
      code: `${NS}const { success: ok, output: value } = v.safeParse(Schema, input); if (ok) save(value);`,
    },
    {
      code: `${NS}const { output, ...rest } = v.safeParse(Schema, input); rest.success && save(output);`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); const alias = result; if (alias.success) save(result.output);`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); const alias = result; if (result.success) save(alias['output']);`,
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); const callback = () => { if (result.success) return result.output; };`,
    },
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
      code: `${NS}function handle(process) { const result = v.safeParse(Schema, input); if (!result.success) process.exit(1); save(result.output); }`,
      errors: [error()],
    },
    {
      code: `${NS}import process from './process.js'; const result = v.safeParse(Schema, input); if (!result.success) process.exit(1); save(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}process = mockProcess; const result = v.safeParse(Schema, input); if (!result.success) process.exit(1); save(result.output);`,
      languageOptions: { globals: { process: 'writable' } },
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (!result.success) process.exitCode = 1; save(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (!result.success) process.exit?.(1); save(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (!result.success && enabled) process.exit(1); save(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); save(result['output']);`,
      errors: [error()],
    },
    {
      code: `${NS}save(v.safeParse(Schema, input)['output']);`,
      errors: [error()],
    },
    {
      code: `${NS}const { success, output } = v.safeParse(Schema, input); save(output);`,
      errors: [error()],
    },
    {
      code: `${NS}const { success: ok, output: value } = v.safeParse(Schema, input); if (!ok) save(value);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); const alias = result; save(alias.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); if (result.success) { function test(result) { save(result.output); } save(result.output); } function other() { save(result.output); }`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); function test(result) { if (result.success) save(outer.output); } const outer = result;`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); result.success = true; if (result.success) save(result.output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); const alias = result; if (result.success) { alias.output = fallback; save(result.output); }`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); result.success = true; const { success, output } = result; if (success) save(output);`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); for (const item of items) { if (result.success) save(result.output); result['success'] = true; }`,
      errors: [error()],
    },
    {
      code: `${NS}const result = v.safeParse(Schema, input); function read() { if (result.success) save(result.output); result.success = true; } read(); read();`,
      errors: [error()],
    },
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
