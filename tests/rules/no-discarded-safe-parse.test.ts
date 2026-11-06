import { Linter, RuleTester } from 'eslint';
import { expect, it } from 'vitest';
import { noDiscardedSafeParse, noUnawaitedParseAsync } from '../../src/rules';

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});
const ns = "import * as v from 'valibot';\n";
tester.run('no-discarded-safe-parse', noDiscardedSafeParse as never, {
  valid: [
    `${ns}const result = v.safeParse(Schema, input);`,
    `${ns}function test() { return v.safeParse(Schema, input); }`,
    `${ns}handle(v.safeParse(Schema, input));`,
    `${ns}if (v.safeParse(Schema, input).success) use(input);`,
    `${ns}v.safeParse?.(Schema, input).success;`,
    `${ns}void v.safeParse?.(Schema, input);`,
    `${ns}v.safeParseAsync(Schema, input);`,
    `${ns}v.safeParseAsync?.(Schema, input);`,
    `${ns}v.safeParseAsync(Schema, input).then(handle);`,
    `${ns}function test(v) { v.safeParse(Schema, input); }`,
    "import { safeParse } from 'other-library'; safeParse(Schema, input);",
  ],
  invalid: [
    {
      code: `${ns}v.safeParse(Schema, input);`,
      errors: [{ messageId: 'discardedResult', data: { name: 'safeParse' } }],
    },
    {
      code: `${ns}await v.safeParseAsync(Schema, input);`,
      errors: [
        { messageId: 'discardedResult', data: { name: 'safeParseAsync' } },
      ],
    },
    {
      code: `${ns}v.safeParse?.(Schema, input);`,
      errors: [{ messageId: 'discardedResult', data: { name: 'safeParse' } }],
    },
    {
      code: `${ns}await v?.safeParseAsync(Schema, input);`,
      errors: [
        { messageId: 'discardedResult', data: { name: 'safeParseAsync' } },
      ],
    },
    {
      code: "import { safeParse as check } from 'valibot'; check(Schema, input);",
      errors: [{ messageId: 'discardedResult' }],
    },
    {
      code: "const { safeParse: check } = require('valibot'); check(Schema, input);",
      errors: [{ messageId: 'discardedResult' }],
    },
  ],
});

it('reports a floating async call only through the existing promise rule', () => {
  const messages = new Linter().verify(
    `${ns}v.safeParseAsync(Schema, input);`,
    [
      {
        plugins: {
          valibot: {
            rules: {
              'no-discarded-safe-parse': noDiscardedSafeParse as never,
              'no-unawaited-parse-async': noUnawaitedParseAsync as never,
            },
          },
        },
        rules: {
          'valibot/no-discarded-safe-parse': 'error',
          'valibot/no-unawaited-parse-async': 'error',
        },
      },
    ],
  );
  expect(messages.map(({ messageId }) => messageId)).toEqual([
    'floatingPromise',
  ]);
});
