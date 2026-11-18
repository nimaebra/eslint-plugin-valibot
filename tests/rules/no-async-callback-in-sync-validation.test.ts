import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import { noAsyncCallbackInSyncValidation } from '../../src/rules';

const ns = "import * as v from 'valibot';\n";
const ruleTester = new RuleTester();

ruleTester.run(
  'no-async-callback-in-sync-validation',
  noAsyncCallbackInSyncValidation as never,
  {
    valid: [
      `${ns}v.check(() => true); v.checkAsync(async () => false); v.transformAsync(async x => x);`,
      `${ns}import { predicate } from './predicates.js'; v.check(predicate);`,
      `${ns}async function check() {} function handle(check) { v.check(check); }`,
      `${ns}function handle(v) { v.check(async () => false); }`,
      `${ns}let predicate = async () => false; v.check(predicate);`,
      `${ns}async function predicate() {} predicate = () => true; v.check(predicate);`,
      `${ns}const a = b; const b = a; v.check(a);`,
      `${ns}v.partialCheck(...args, async () => false); v.partialCheck([]);`,
      `${ns}const { predicate } = { predicate: async () => false }; v.check(predicate);`,
      'other.check(async () => false);',
      {
        code: `${ns}type Predicate = () => boolean; const check: Predicate = () => true; v.check(check);`,
        languageOptions: { parser: tseslint.parser },
      },
    ],
    invalid: [
      ...[
        'check',
        'checkItems',
        'custom',
        'rawCheck',
        'rawTransform',
        'transform',
      ].map((name) => ({
        code: `${ns}v.${name}(async function () { return false; });`,
        errors: [{ messageId: 'useAsyncApi' as const, data: { name } }],
      })),
      ...['everyItem', 'someItem', 'guard'].map((name) => ({
        code: `${ns}v.${name}(async () => false);`,
        errors: [{ messageId: 'useSyncCallback' as const, data: { name } }],
      })),
      {
        code: "import { partialCheck as check, pipeAsync, object } from 'valibot'; async function valid() { return false; } const callback = valid; const alias = callback; pipeAsync(object({}), check([], alias));",
        errors: [{ messageId: 'useAsyncApi', data: { name: 'partialCheck' } }],
      },
      {
        code: "const { check } = require('valibot'); check(async () => false);",
        languageOptions: { sourceType: 'commonjs' },
        errors: [{ messageId: 'useAsyncApi', data: { name: 'check' } }],
      },
      {
        code: `${ns}const predicate = (async (x: string) => x !== '') satisfies ((x: string) => Promise<boolean>); v.check(predicate!);`,
        languageOptions: { parser: tseslint.parser },
        errors: [{ messageId: 'useAsyncApi', data: { name: 'check' } }],
      },
    ],
  },
);
