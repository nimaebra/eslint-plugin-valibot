import { runInNewContext } from 'node:vm';

import { Linter } from 'eslint';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { noInstanceofBuiltins } from '../../src/rules';

const linter = new Linter();
const config: Linter.Config[] = [
  {
    plugins: {
      valibot: {
        rules: {
          'no-instanceof-builtins': noInstanceofBuiltins as never,
        },
      },
    },
    rules: {
      'valibot/no-instanceof-builtins': 'error',
    },
  },
];

function evaluate(code: string): unknown {
  return runInNewContext(code.replace("import * as v from 'valibot';", ''), {
    v,
    // Use the same constructors as Valibot's realm for instanceof checks.
    Array,
    Map,
    Set,
    Date,
    String,
  });
}

describe('built-in instance autofix runtime safety', () => {
  it.each([
    ['Array', 'new Array(1)'],
    ['Map', "new Map([['x', 1]])"],
    ['Set', 'new Set([1])'],
    ['String', "new String('a')"],
    ['Date', 'new Date(Number.NaN)'],
  ])('keeps instance(%s) unchanged during --fix', (constructor, value) => {
    const code = `import * as v from 'valibot';\nv.is(v.instance(${constructor}), ${value});`;
    const result = linter.verifyAndFix(code, config);

    expect(evaluate(code)).toBe(true);
    expect(result.messages).toHaveLength(1);
    expect(result.fixed).toBe(false);
    expect(evaluate(result.output)).toBe(true);
  });
});
