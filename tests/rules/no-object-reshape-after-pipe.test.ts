import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import { noObjectReshapeAfterPipe } from '../../src/rules';

const ns = "import * as v from 'valibot';\n";
const ruleTester = new RuleTester();
const error = (reshape: string, pipe = 'pipe') => ({
  messageId: 'reshapeBeforePipe' as const,
  data: { reshape, pipe },
});

ruleTester.run(
  'no-object-reshape-after-pipe',
  noObjectReshapeAfterPipe as never,
  {
    valid: [
      `${ns}v.pipe(v.pick(v.object({ x: v.string() }), ['x']), v.check(() => true));`,
      `${ns}v.pick(v.pipe(v.string(), v.trim()), ['x']);`,
      `${ns}v.keyof(v.pipe(v.object({}), v.description('about')));`,
      `${ns}const Schema = v.pipe(v.object({})); function pick(Schema) { v.pick(Schema, []); }`,
      `${ns}let Schema = v.pipe(v.object({})); v.pick(Schema, []);`,
      `${ns}const Schema = v.pipe(Schema); v.omit(Schema, []);`,
      `${ns}v.pick(v.pipe(...args), []); v.pick();`,
      `${ns}function f(v) { v.pick(v.pipe(v.object({})), []); }`,
      'other.pick(other.pipe(other.object({})), []);',
      {
        code: `${ns}const Schema = v.object({}); v.pick(Schema, []);`,
        languageOptions: { parser: tseslint.parser },
      },
    ],
    invalid: [
      {
        code: `${ns}v.pick(v.pipe(v.object({ x: v.string() }), v.check(() => true)), ['x']);`,
        errors: [error('pick')],
      },
      {
        code: `${ns}v.omit(v.pipe(v.looseObject({}), v.description('about')), []);`,
        errors: [error('omit')],
      },
      {
        code: `${ns}v.partial(v.pipe(v.strictObject({})));`,
        errors: [error('partial')],
      },
      {
        code: `${ns}v.required(v.pipe(v.objectWithRest({}, v.string())));`,
        errors: [error('required')],
      },
      {
        code: `${ns}v.requiredAsync(v.pipeAsync(v.strictObjectAsync({})));`,
        errors: [error('requiredAsync', 'pipeAsync')],
      },
      {
        code: "import { partialAsync as patch, pipeAsync as piped, pipe, object } from 'valibot'; const base = object({}); const schema = piped(pipe(base)); const alias = schema; patch(alias);",
        errors: [error('partialAsync', 'pipeAsync')],
      },
      {
        code: "const v = require('valibot'); const schema = v.pipe(v.object({})); v.omit(schema, []);",
        languageOptions: { sourceType: 'commonjs' },
        errors: [error('omit')],
      },
      {
        code: `${ns}const schema = v.pipe(v.object({})) as unknown; v.pick(schema!, []);`,
        languageOptions: { parser: tseslint.parser },
        errors: [error('pick')],
      },
    ],
  },
);
