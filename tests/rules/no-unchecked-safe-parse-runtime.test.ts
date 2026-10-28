import { runInNewContext } from 'node:vm';

import { Linter } from 'eslint';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { noUncheckedSafeParse } from '../../src/rules';

const linter = new Linter();
const config: Linter.Config[] = [
  {
    plugins: {
      valibot: {
        rules: { 'no-unchecked-safe-parse': noUncheckedSafeParse as never },
      },
    },
    rules: { 'valibot/no-unchecked-safe-parse': 'error' },
  },
];

const guards = [
  'result.success',
  '!result.success',
  '!!result.success',
  'result.success === true',
  'false === result.success',
  'result.success == true',
  'false == result.success',
  'result.success !== false',
  'true !== result.success',
  'result.success != false',
  'true != result.success',
  'result.success && enabled',
  'enabled && result.success',
  'result.success || enabled',
  'enabled || result.success',
  '!result.success && enabled',
  '!result.success || enabled',
  '(result.success && enabled) || (result.success && !enabled)',
  '(!result.success || enabled) && (!result.success || !enabled)',
];

const contexts = [
  ['if consequent', (guard: string) => `if (${guard}) consume(result.output);`],
  [
    'if alternate',
    (guard: string) => `if (${guard}) {} else consume(result.output);`,
  ],
  [
    'conditional consequent',
    (guard: string) => `(${guard}) ? consume(result.output) : null;`,
  ],
  [
    'conditional alternate',
    (guard: string) => `(${guard}) ? null : consume(result.output);`,
  ],
  ['logical AND', (guard: string) => `(${guard}) && consume(result.output);`],
  ['logical OR', (guard: string) => `(${guard}) || consume(result.output);`],
  [
    'early return',
    (guard: string) => `if (${guard}) return; consume(result.output);`,
  ],
  [
    'else return',
    (guard: string) => `if (${guard}) {} else return; consume(result.output);`,
  ],
] as const;

describe('safeParse guards against actual execution', () => {
  describe.each(contexts)('%s', (_name, body) => {
    it.each(guards)('%s', (guard) => {
      const code = `
        const v = require('valibot');
        function handle(input, enabled) {
          const result = v.safeParse(v.string(), input);
          function consume(output) { observations.push(result.success); }
          ${body(guard)}
        }
        for (const input of ['valid', 42]) {
          for (const enabled of [true, false]) handle(input, enabled);
        }
      `;
      const observations: boolean[] = [];

      // Execute every combination of validation success and the unrelated flag.
      // The oracle is whether invalid data can reach consume(), independent of
      // the rule's AST analysis.
      runInNewContext(code, {
        require: () => v,
        observations,
      });

      const messages = linter.verify(code, config);

      expect(messages.some((message) => message.fatal)).toBe(false);
      expect(messages.map((message) => message.messageId)).toEqual(
        observations.includes(false) ? ['uncheckedOutput'] : [],
      );
    });
  });
});
