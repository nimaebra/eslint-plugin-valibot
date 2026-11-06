import { RuleTester } from 'eslint';
import { noSharedMutableDefault } from '../../src/rules';

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});
const ns = "import * as v from 'valibot';\n";
tester.run('no-shared-mutable-default', noSharedMutableDefault as never, {
  valid: [
    `${ns}v.optional(v.unknown(), () => []);`,
    `${ns}v.optional(v.unknown(), 'default');`,
    `${ns}v.optional(v.unknown(), defaults);`,
    `${ns}v.optional(v.array(v.string()), []);`,
    `${ns}v.optional(v.object({}), {});`,
    `${ns}v.optional(v.pipe(v.unknown(), v.transform(copy)), {});`,
    `${ns}v.optional(v.date(), {});`,
    `${ns}v.optional(v.unknown());`,
    `${ns}v.optional(Schema, []);`,
    `${ns}function test(Date) { return v.optional(v.date(), new Date()); }`,
    `${ns}function test(v) { return v.optional(v.unknown(), []); }`,
    "import * as v from 'other-library'; v.optional(v.unknown(), []);",
  ],
  invalid: [
    ...[
      'optional',
      'nullable',
      'nullish',
      'undefinedable',
      'exactOptional',
      'optionalAsync',
    ].map((name) => ({
      code: `${ns}v.${name}(v.unknown(), []);`,
      errors: [
        {
          messageId: 'sharedDefault',
          data: { name },
          suggestions: [
            {
              messageId: 'useFactory',
              output: `${ns}v.${name}(v.unknown(), () => ([]));`,
            },
          ],
        },
      ],
    })),
    {
      code: `${ns}v.optional(v.any(), { items: [] });`,
      errors: [
        {
          messageId: 'sharedDefault',
          suggestions: [
            {
              messageId: 'useFactory',
              output: `${ns}v.optional(v.any(), () => ({ items: [] }));`,
            },
          ],
        },
      ],
    },
    {
      code: `${ns}v.optional(v.date(), new Date());`,
      errors: [
        {
          messageId: 'sharedDefault',
          suggestions: [
            {
              messageId: 'useFactory',
              output: `${ns}v.optional(v.date(), () => (new Date()));`,
            },
          ],
        },
      ],
    },
    {
      code: "import { optional, unknown } from 'valibot'; optional(unknown(), {});",
      errors: [
        {
          messageId: 'sharedDefault',
          suggestions: [
            {
              messageId: 'useFactory',
              output:
                "import { optional, unknown } from 'valibot'; optional(unknown(), () => ({}));",
            },
          ],
        },
      ],
    },
    ...[
      `${ns}v.optional(v.unknown(), [await load()]);`,
      `${ns}function* schema() { return v.optional(v.any(), { value: yield item }); }`,
      `${ns}v.optional(v.date(), new Date(await load()));`,
    ].map((code) => ({
      code,
      errors: [{ messageId: 'sharedDefault', suggestions: [] }],
    })),
    {
      code: `${ns}v.optional(v.unknown(), [async () => await load()]);`,
      errors: [
        {
          messageId: 'sharedDefault',
          suggestions: [
            {
              messageId: 'useFactory',
              output: `${ns}v.optional(v.unknown(), () => ([async () => await load()]));`,
            },
          ],
        },
      ],
    },
  ],
});
