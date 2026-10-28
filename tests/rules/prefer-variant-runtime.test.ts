import { runInNewContext } from 'node:vm';

import { Linter } from 'eslint';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { preferVariant } from '../../src/rules';

const linter = new Linter();
const config: Linter.Config[] = [
  {
    plugins: {
      valibot: { rules: { 'prefer-variant': preferVariant as never } },
    },
    rules: { 'valibot/prefer-variant': 'error' },
  },
];

describe('variant autofix runtime safety', () => {
  it.each([
    'kind',
    "kind's",
    'path\\kind',
    "path\\'kind",
    'line\nkind',
    'line\rkind',
    'tab\tkind',
  ])('preserves discriminant key %j', (key) => {
    const code = `
      const v = require('valibot');
      const Schema = v.union([
        v.object({ ${JSON.stringify(key)}: v.literal('create'), value: v.string() }),
        v.object({ ${JSON.stringify(key)}: v.literal('delete'), value: v.number() }),
      ]);
      inputs.map(input => v.safeParse(Schema, input).success);
    `;
    const inputs = [
      { [key]: 'create', value: 'hello' },
      { [key]: 'delete', value: 42 },
      { [key]: 'create', value: 42 },
      { [key]: 'unknown', value: 'hello' },
    ];
    const evaluate = (source: string): unknown =>
      runInNewContext(source, { require: () => v, inputs });
    const result = linter.verifyAndFix(code, config);

    expect(evaluate(code)).toEqual([true, true, false, false]);
    expect(result.fixed).toBe(true);
    expect(result.messages).toEqual([]);
    expect(evaluate(result.output)).toEqual(evaluate(code));
    expect(linter.verifyAndFix(result.output, config).fixed).toBe(false);
  });
});
