import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import { preferExactPipeConstraint } from '../../src/rules';

const ns = "import * as v from 'valibot';\n";
const length = {
  messageId: 'preferExact' as const,
  data: { min: 'minLength', max: 'maxLength', exact: 'length', value: '2' },
};
const size = {
  messageId: 'preferExact' as const,
  data: { min: 'minSize', max: 'maxSize', exact: 'size', value: '2' },
};

new RuleTester().run(
  'prefer-exact-pipe-constraint',
  preferExactPipeConstraint as never,
  {
    valid: [
      `${ns}v.pipe(v.string(), v.length(2));`,
      `${ns}v.pipe(v.string(), v.minLength(2), v.maxLength(3));`,
      `${ns}v.pipe(v.string(), v.minLength(-2), v.maxLength(-2));`,
      `${ns}v.pipe(v.string(), v.minLength(2.5), v.maxLength(2.5));`,
      `${ns}const limit = 2; v.pipe(v.string(), v.minLength(limit), v.maxLength(limit));`,
      `${ns}v.pipe(v.string(), v.minLength(2), v.trim(), v.maxLength(2));`,
      `${ns}v.pipe(v.string(), v.minLength(2), ...actions, v.maxLength(2));`,
      `${ns}v.pipe(v.string(), v.minLength(2), unknownAction, v.maxLength(2));`,
      `${ns}v.pipe(v.string(), v.minLength(2), v.maxSize(2));`,
      `${ns}function f(v) { return v.pipe(v.string(), v.minLength(2), v.maxLength(2)); }`,
      'other.pipe(other.string(), other.minLength(2), other.maxLength(2));',
    ],
    invalid: [
      {
        code: `${ns}v.pipe(v.string(), v.minLength(2, 'too short'), v.maxLength(2, 'too long'));`,
        errors: [length],
      },
      {
        code: "import { array, string, pipeAsync, minLength as min, maxLength as max } from 'valibot'; pipeAsync(array(string()), max(2), min(2));",
        errors: [length],
      },
      {
        code: "const v = require('valibot'); v.pipe(v.set(v.string()), v.maxSize(2), v.minSize(2));",
        languageOptions: { sourceType: 'commonjs' },
        errors: [size],
      },
      {
        code: `${ns}const Schema = v.pipe(v.blob(), v.minSize(2), v.maxSize(2)) as unknown;`,
        languageOptions: { parser: tseslint.parser },
        errors: [size],
      },
    ],
  },
);
