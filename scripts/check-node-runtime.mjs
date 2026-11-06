import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import process from 'node:process';
import { Linter } from 'eslint';
import * as esm from '../dist/index.mjs';

const require = createRequire(import.meta.url);
const cjs = require('../dist/index.cjs');
assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort());
for (const api of [esm, cjs]) {
  const messages = new Linter().verify(
    "import * as v from 'valibot'; v.safeParse(v.optional(v.unknown(), []), input);",
    [
      {
        plugins: { valibot: api.default },
        rules: {
          'valibot/no-discarded-safe-parse': 'error',
          'valibot/no-shared-mutable-default': 'error',
        },
      },
    ],
  );
  assert.deepEqual(messages.map(({ messageId }) => messageId).sort(), [
    'discardedResult',
    'sharedDefault',
  ]);
}
process.stdout.write(`Built ESM/CJS package works on ${process.version}.\n`);
