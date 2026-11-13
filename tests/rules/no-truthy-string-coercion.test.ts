import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import { noTruthyStringCoercion } from '../../src/rules';

const ns = "import * as v from 'valibot';\n";
const errors = [{ messageId: 'truthyString' as const }];

new RuleTester().run(
  'no-truthy-string-coercion',
  noTruthyStringCoercion as never,
  {
    valid: [
      `${ns}v.pipe(v.string(), v.parseBoolean());`,
      `${ns}v.pipe(v.picklist(['true', 'false']), v.transform(value => value === 'true'));`,
      `${ns}v.pipe(v.number(), v.toBoolean()); v.pipe(v.string(), v.toNumber(), v.toBoolean());`,
      `${ns}v.pipe(v.string(), ...actions, v.toBoolean()); v.pipe(v.string(), unknownAction, v.toBoolean());`,
      `${ns}function f(Boolean) { return v.pipe(v.string(), v.transform(Boolean)); }`,
      `${ns}v.pipe(v.string(), v.transform(unknown));`,
      `${ns}function f(v) { return v.pipe(v.string(), v.toBoolean()); }`,
      `${ns}function f(string) { return v.pipe(string(), v.toBoolean()); }`,
      `${ns}v.pipe(v.string()); v.pipe();`,
      `${ns}v.pipe(v.string(), v.transform(), v.toBoolean());`,
      `${ns}v.pipe(v.string(), v.unknownAction(), v.toBoolean());`,
      `${ns}v.pipe(v.pipe(v.string(), v.toNumber()), v.toBoolean());`,
      `${ns}const schema = v.pipe(schema); v.pipe(schema, v.toBoolean());`,
      {
        code: `${ns}Boolean = customBoolean; v.pipe(v.string(), v.transform(Boolean));`,
        languageOptions: { globals: { Boolean: 'writable' } },
      },
    ],
    invalid: [
      { code: `${ns}v.pipe(v.string(), v.toBoolean());`, errors },
      {
        code: `${ns}const trimmed = v.pipe(v.string(), v.trim()); v.pipe(trimmed, v.toBoolean());`,
        errors,
      },
      {
        code: `${ns}v.pipeAsync(v.string(), v.trim(), v.description('flag'), v.transform(Boolean));`,
        errors,
      },
      {
        code: "import { pipe, string, toBoolean as coerce } from 'valibot'; const schema = string(); const action = coerce(); pipe(schema, action);",
        errors,
      },
      {
        code: "const v = require('valibot'); v.pipe(v.string(), v.minLength(1), v.transform(Boolean));",
        languageOptions: { sourceType: 'commonjs' },
        errors,
      },
      {
        code: `${ns}type Boolean = string; const Schema = v.string() as ReturnType<typeof v.string>; v.pipe(Schema, v.transform(Boolean));`,
        languageOptions: { parser: tseslint.parser },
        errors,
      },
    ],
  },
);
