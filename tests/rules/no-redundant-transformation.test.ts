import { RuleTester } from 'eslint';

import { noRedundantTransformation } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run(
  'no-redundant-transformation',
  noRedundantTransformation as never,
  {
    valid: [
      // Not a valibot transform call
      {
        code: "import { transform } from 'other-lib';\nconst Schema = v.pipe(v.string(), transform((val) => val.toLowerCase()));",
      },
      // Transform with non-built-in method
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.replace('-', '_')));",
      },
      // Transform with block body and multiple statements
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => { const lower = val.toLowerCase(); return lower; }));",
      },
      // Transform with extra arguments
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.toLowerCase('en')));",
      },
      // Transform with multiple params
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val, ctx) => val.toLowerCase()));",
      },
      // Transform with destructured param
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform(({ value }) => value.toLowerCase()));",
      },
      // Transform with non-this param reference
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => other.toLowerCase()));",
      },
      // Transform with computed member
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val['toLowerCase']()));",
      },
      // Transform with no arguments
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val));",
      },
      // Transform with non-call expression body
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val + '!'));",
      },
      // Already using built-in action
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.toLowerCase());",
      },
      // Transform with non-Identifier param (rest element)
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((...args) => args[0].toLowerCase()));",
      },
      // Block body with expression statement but no return
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => { val.toLowerCase(); }));",
      },
    ],
    invalid: [
      // toLowerCase with namespace import
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.toLowerCase()));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.toLowerCase());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'toLowerCase' },
          },
        ],
      },
      // toUpperCase with namespace import
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.toUpperCase()));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.toUpperCase());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'toUpperCase' },
          },
        ],
      },
      // trim with namespace import
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.trim()));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trim());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'trim' },
          },
        ],
      },
      // trimStart with namespace import
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.trimStart()));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trimStart());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'trimStart' },
          },
        ],
      },
      // trimEnd with namespace import
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.trimEnd()));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.trimEnd());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'trimEnd' },
          },
        ],
      },
      // normalize with namespace import
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.normalize()));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.normalize());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'normalize' },
          },
        ],
      },
      // toLowerCase with named import
      {
        code: "import { pipe, string, transform, toLowerCase } from 'valibot';\nconst Schema = pipe(string(), transform((val) => val.toLowerCase()));",
        output: "import { pipe, string, transform, toLowerCase } from 'valibot';\nconst Schema = pipe(string(), toLowerCase());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'toLowerCase' },
          },
        ],
      },
      // toUpperCase with named import (aliased)
      {
        code: "import { pipe, string, transform, toUpperCase as toUpper } from 'valibot';\nconst Schema = pipe(string(), transform((val) => val.toUpperCase()));",
        output: "import { pipe, string, transform, toUpperCase as toUpper } from 'valibot';\nconst Schema = pipe(string(), toUpper());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'toUpperCase' },
          },
        ],
      },
      // toLocaleLowerCase maps to toLowerCase
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.toLocaleLowerCase()));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.toLowerCase());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'toLowerCase' },
          },
        ],
      },
      // toLocaleUpperCase maps to toUpperCase
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.toLocaleUpperCase()));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.toUpperCase());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'toUpperCase' },
          },
        ],
      },
      // Block body with return statement
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => { return val.toLowerCase(); }));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.toLowerCase());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'toLowerCase' },
          },
        ],
      },
      // toWellFormed with namespace import
      {
        code: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.transform((val) => val.toWellFormed()));",
        output: "import * as v from 'valibot';\nconst Schema = v.pipe(v.string(), v.toWellFormed());",
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'toWellFormed' },
          },
        ],
      },
      // Named import without target action imported (report only, no fix)
      {
        code: "import { pipe, string, transform } from 'valibot';\nconst Schema = pipe(string(), transform((val) => val.toLowerCase()));",
        output: null,
        errors: [
          {
            messageId: 'redundantTransform' as const,
            data: { valibotAction: 'toLowerCase' },
          },
        ],
      },
    ],
  },
);
