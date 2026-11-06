import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import plugin from '../../src/plugin';

const config: Linter.Config[] = [
  {
    languageOptions: { parser: tseslint.parser as never },
    plugins: { valibot: plugin as never },
    rules: {
      'valibot/no-any-schema': 'error',
      'valibot/no-empty-pipe': 'error',
      'valibot/no-empty-union': 'error',
    },
  },
];

describe('Valibot binding resolution', () => {
  it.each([
    "import * as v from 'valibot'; function test(v) { return v.any(); }",
    "import { any as anySchema } from 'valibot'; function test(anySchema) { return anySchema(); }",
    "import * as v from 'valibot'; { const v = other; v.union([]); }",
    "const v = require('valibot'); function test(v) { return v.pipe(); }",
    "const { any: anySchema } = require('valibot'); function test(anySchema) { return anySchema(); }",
    "function require() { return other; } const v = require('valibot'); v.any();",
    "let v = require('valibot'); v = other; v.any();",
    "let { any: anySchema } = require('valibot'); anySchema = other; anySchema();",
    "import type * as v from 'valibot'; v.any();",
    "import { type any as anySchema } from 'valibot'; anySchema();",
  ])('ignores unrelated or unavailable runtime bindings: %s', (code) => {
    expect(new Linter().verify(code, config)).toEqual([]);
  });

  it.each(['valibot', 'npm:valibot@^1.0.0', 'jsr:@valibot/valibot@^1.0.0'])(
    'retains real namespace and aliased references from %s',
    (source) => {
      const code = `import * as v from '${source}'; import { any as anySchema } from '${source}'; function test() { v.any(); anySchema(); }`;
      const messages = new Linter().verify(code, config);
      expect(messages.map(({ ruleId }) => ruleId)).toEqual([
        'valibot/no-any-schema',
        'valibot/no-any-schema',
      ]);
    },
  );

  it.each([
    "import { any as make } from 'valibot'; function test() { type make = string; return make(); }",
    "import * as v from 'valibot'; function test() { type v = string; return v.any(); }",
    "import { any as make } from 'valibot'; function test(schema = make()) { const make = other; return schema; }",
  ])('recognizes the resolved runtime reference: %s', (code) => {
    expect(
      new Linter().verify(code, config).map(({ ruleId }) => ruleId),
    ).toEqual(['valibot/no-any-schema']);
  });

  it('does not use a shadowed named import in an autofix', () => {
    const code =
      "import { union, literal, picklist } from 'valibot'; function test(picklist) { return union([literal('a'), literal('b')]); }";
    const result = new Linter().verifyAndFix(code, [
      {
        plugins: { valibot: plugin as never },
        rules: { 'valibot/prefer-picklist': 'error' },
      },
    ]);
    expect(result.messages.map(({ messageId }) => messageId)).toEqual([
      'preferPicklist',
    ]);
    expect(result.fixed).toBe(false);
  });

  it('keeps type-only inference helpers usable and schema bindings scoped', () => {
    const code =
      "import * as v from 'valibot'; import type { InferOutput } from 'valibot'; const Schema = v.string(); type Value = InferOutput<typeof Schema>; function test(Schema: number) { type Value = typeof Schema; }";
    expect(
      new Linter().verify(code, [
        {
          languageOptions: { parser: tseslint.parser as never },
          plugins: { valibot: plugin as never },
          rules: { 'valibot/no-schema-as-type': 'error' },
        },
      ]),
    ).toEqual([]);
  });
});
