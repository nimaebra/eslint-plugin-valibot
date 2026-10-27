import { runInNewContext } from 'node:vm';

import { Linter } from 'eslint';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { noDuplicatePipeActions } from '../../src/rules';

const linter = new Linter();
const config: Linter.Config[] = [
  {
    plugins: {
      valibot: {
        rules: {
          'no-duplicate-pipe-actions': noDuplicatePipeActions as never,
        },
      },
    },
    rules: {
      'valibot/no-duplicate-pipe-actions': 'error',
    },
  },
];

function evaluate(code: string): unknown {
  return runInNewContext(code.replace("import * as v from 'valibot';", ''), {
    v,
  });
}

describe('duplicate pipe action autofix runtime safety', () => {
  it.each([
    [
      'multiplication transforms',
      'v.parse(v.pipe(v.number(), v.transform(value => value * 2), v.transform(value => value * 2)), 1)',
      4,
    ],
    [
      'trim after a transform',
      "v.parse(v.pipe(v.string(), v.trim(), v.transform(value => value + ' '), v.trim()), 'a')",
      'a',
    ],
    [
      'validation after a transform',
      "v.safeParse(v.pipe(v.string(), v.minLength(1), v.transform(() => ''), v.minLength(1)), 'a').success",
      false,
    ],
    [
      'stateful callbacks',
      '(() => { let count = 0; return v.safeParse(v.pipe(v.number(), v.check(() => ++count < 2), v.check(() => ++count < 2)), 1).success; })()',
      false,
    ],
  ])('preserves %s', (_name, expression, expected) => {
    const code = `import * as v from 'valibot';\n${expression};`;
    const result = linter.verifyAndFix(code, config);

    expect(evaluate(code)).toBe(expected);
    expect(result.fixed).toBe(false);
    expect(evaluate(result.output)).toBe(expected);
  });

  it('still removes consecutive idempotent transforms', () => {
    const code =
      "import * as v from 'valibot';\nv.parse(v.pipe(v.string(), v.trim(), v.trim()), ' a ');";
    const result = linter.verifyAndFix(code, config);

    expect(result.fixed).toBe(true);
    expect(evaluate(result.output)).toBe(evaluate(code));
  });
});
