import { RuleTester } from 'eslint';

import { preferVariant } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-variant', preferVariant as never, {
  valid: [
    {
      code: 'const Schema = other.union([other.object({ type: other.literal("a") }), other.object({ type: other.literal("b") })]);',
    },
    ...[
      'v.union(options)',
      'v.union([])',
      "v.union([v.object({ type: v.literal('a') })])",
      "v.union([, v.object({ type: v.literal('b') })])",
      "v.union([...options, v.object({ type: v.literal('b') })])",
      "v.union([FirstSchema, v.object({ type: v.literal('b') })])",
      "v.union([other.object({ type: v.literal('a') }), v.object({ type: v.literal('b') })])",
      "v.union([v.object(entries), v.object({ type: v.literal('b') })])",
      "v.union([v.object({ [key]: v.literal('a') }), v.object({ type: v.literal('b') })])",
      "v.union([v.object({ 0: v.literal('a') }), v.object({ type: v.literal('b') })])",
      "v.union([v.object({ type: literalSchema }), v.object({ type: v.literal('b') })])",
      "v.union([v.object({ type: v.literal('a', 'message') }), v.object({ type: v.literal('b') })])",
      "v.union([v.object({ type: v.literal(value) }), v.object({ type: v.literal('b') })])",
    ].map((expression) => ({
      code: `import * as v from 'valibot'; const Schema = ${expression};`,
    })),
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.objectAsync({ type: v.literal('a') }), v.object({ type: v.literal('b') })]);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.variant('type', [v.object({ type: v.literal('a'), id: v.string() }), v.object({ type: v.literal('b'), id: v.string() })]);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.string(), v.number()]);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.object({ kind: v.literal('a') }), v.object({ type: v.literal('b') })]);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.object({ type: v.string() }), v.object({ type: v.literal('b') })]);",
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.object({ type: v.literal('a') }), v.object({ type: v.literal('a') })]);",
    },
  ],
  invalid: [
    {
      code: "import * as v from 'valibot'; const Schema = v.union([v.strictObject({ ...entries, category: v.literal('shared'), kind: v.literal('a') }), v.looseObject({ category: v.literal('shared'), kind: v.literal('b') })]);",
      output:
        "import * as v from 'valibot'; const Schema = v.variant('kind', [v.strictObject({ ...entries, category: v.literal('shared'), kind: v.literal('a') }), v.looseObject({ category: v.literal('shared'), kind: v.literal('b') })]);",
      errors: [{ messageId: 'preferVariant', data: { key: 'kind' } }],
    },
    {
      code: "import { union as either, variant as tagged, object, literal } from 'valibot'; const Schema = either([object({ kind: literal('a') }), object({ kind: literal('b') })]);",
      output:
        "import { union as either, variant as tagged, object, literal } from 'valibot'; const Schema = tagged('kind', [object({ kind: literal('a') }), object({ kind: literal('b') })]);",
      errors: [{ messageId: 'preferVariant', data: { key: 'kind' } }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.unionAsync([v.objectAsync({ type: v.literal('a') }), v.object({ type: v.literal('b') })]);",
      output:
        "import * as v from 'valibot';\nconst Schema = v.variantAsync('type', [v.objectAsync({ type: v.literal('a') }), v.object({ type: v.literal('b') })]);",
      errors: [{ messageId: 'preferVariant' }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.object({ type: v.literal('a'), id: v.string() }), v.object({ type: v.literal('b'), id: v.string() })]);",
      output:
        "import * as v from 'valibot';\nconst Schema = v.variant('type', [v.object({ type: v.literal('a'), id: v.string() }), v.object({ type: v.literal('b'), id: v.string() })]);",
      errors: [{ messageId: 'preferVariant', data: { key: 'type' } }],
    },
    {
      code: "import { object, string, union, variant, literal } from 'valibot';\nconst Schema = union([object({ kind: literal('x'), value: string() }), object({ kind: literal('y'), value: string() })]);",
      output:
        "import { object, string, union, variant, literal } from 'valibot';\nconst Schema = variant('kind', [object({ kind: literal('x'), value: string() }), object({ kind: literal('y'), value: string() })]);",
      errors: [{ messageId: 'preferVariant', data: { key: 'kind' } }],
    },
    {
      code: "import { object, string, union, literal } from 'valibot';\nconst Schema = union([object({ type: literal('a'), id: string() }), object({ type: literal('b'), id: string() })]);",
      errors: [{ messageId: 'preferVariant', data: { key: 'type' } }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.object({ type: v.literal('a') }), v.object({ type: v.literal('b') })], 'Invalid payload');",
      errors: [{ messageId: 'preferVariant', data: { key: 'type' } }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.union([v.objectWithRest({ kind: v.literal('a') }, v.string()), v.objectWithRest({ kind: v.literal('b') }, v.string())]);",
      output:
        "import * as v from 'valibot';\nconst Schema = v.variant('kind', [v.objectWithRest({ kind: v.literal('a') }, v.string()), v.objectWithRest({ kind: v.literal('b') }, v.string())]);",
      errors: [{ messageId: 'preferVariant', data: { key: 'kind' } }],
    },
  ],
});
