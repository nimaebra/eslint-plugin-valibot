import { runInNewContext } from 'node:vm';

import { Linter } from 'eslint';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import {
  noAsyncCallbackInSyncValidation,
  noObjectReshapeAfterPipe,
} from '../../src/rules';

const linter = new Linter();
const config: Linter.Config[] = [
  {
    plugins: {
      valibot: {
        rules: {
          'no-async-callback-in-sync-validation':
            noAsyncCallbackInSyncValidation as never,
          'no-object-reshape-after-pipe': noObjectReshapeAfterPipe as never,
        },
      },
    },
    rules: {
      'valibot/no-async-callback-in-sync-validation': 'error',
      'valibot/no-object-reshape-after-pipe': 'error',
    },
  },
];

function lintAndRun(code: string) {
  const source = `const v = require('valibot');\n${code}`;
  const messages = linter.verify(source, config);
  expect(messages.some((message) => message.fatal)).toBe(false);
  return {
    reports: messages.map(({ messageId }) => messageId),
    result: runInNewContext(source, { require: () => v }) as unknown,
  };
}

describe('runtime behavior behind validation rules', () => {
  it('catches a false async predicate accepted by a sync check', async () => {
    const unsafe = lintAndRun(`
      const schema = v.pipe(v.string(), v.check(async () => false));
      v.safeParse(schema, 'input').success;
    `);
    expect(unsafe).toEqual({ reports: ['useAsyncApi'], result: true });

    const corrected = lintAndRun(`
      const schema = v.pipeAsync(v.string(), v.checkAsync(async () => false));
      v.safeParseAsync(schema, 'input').then(result => result.success);
    `);
    expect(corrected.reports).toEqual([]);
    expect(await corrected.result).toBe(false);
  });

  it('catches a picked schema still validating a removed field', () => {
    const base =
      'const base = v.object({ name: v.string(), admin: v.boolean() });';
    const unsafe = lintAndRun(`
      ${base}
      const schema = v.pick(v.pipe(base, v.check(data => data.name.length > 0)), ['name']);
      v.safeParse(schema, { name: 'Ada' }).success;
    `);
    expect(unsafe).toEqual({ reports: ['reshapeBeforePipe'], result: false });

    const corrected = lintAndRun(`
      ${base}
      const schema = v.pipe(v.pick(base, ['name']), v.check(data => data.name.length > 0));
      v.safeParse(schema, { name: 'Ada' }).success;
    `);
    expect(corrected).toEqual({ reports: [], result: true });
  });
});
