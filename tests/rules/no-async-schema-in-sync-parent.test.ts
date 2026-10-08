import { RuleTester } from 'eslint';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { noAsyncSchemaInSyncParent } from '../../src/rules';
import { SYNC_SCHEMA_PARENTS } from '../../src/rules/no-async-schema-in-sync-parent';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

const NS = "import * as v from 'valibot';\n";
const ASYNC_EMAIL =
  'v.pipeAsync(v.string(), v.checkAsync(async (value) => isFree(value)))';

describe('SYNC_SCHEMA_PARENTS', () => {
  it('only lists sync APIs that have an Async twin, except assert() and is()', () => {
    const missingTwins = [...SYNC_SCHEMA_PARENTS.keys()].filter(
      (name) => name !== 'assert' && name !== 'is' && !(`${name}Async` in v),
    );

    expect(missingTwins).toEqual([]);
  });
});

ruleTester.run(
  'no-async-schema-in-sync-parent',
  noAsyncSchemaInSyncParent as never,
  {
    valid: [
      {
        code: `${NS}const Schema = v.objectAsync({ email: ${ASYNC_EMAIL} });`,
      },
      {
        code: `${NS}const Schema = v.object({ email: v.pipe(v.string(), v.email()) });`,
      },
      {
        code: `${NS}const Email = ${ASYNC_EMAIL};\nconst Schema = v.objectAsync({ email: Email });\nconst result = await v.safeParseAsync(Schema, input);`,
      },
      {
        code: `${NS}const Schema = v.pick(v.objectAsync({ email: ${ASYNC_EMAIL} }), ['email']);`,
      },
      {
        code: `${NS}let Email = ${ASYNC_EMAIL};\nEmail = v.string();\nconst Schema = v.object({ email: Email });`,
      },
      {
        code: "import { object } from 'valibot';\nimport { objectAsync } from 'other-library';\nconst Schema = object({ nested: objectAsync({}) });",
      },
    ],
    invalid: [
      {
        code: `${NS}const Schema = v.object({ email: ${ASYNC_EMAIL} });`,
        errors: [
          {
            messageId: 'asyncSchemaInSyncParent',
            data: { parent: 'object', child: 'pipeAsync()' },
          },
        ],
      },
      {
        code: `${NS}const Email = ${ASYNC_EMAIL};\nconst Schema = v.object({ email: Email });`,
        errors: [
          {
            messageId: 'asyncSchemaInSyncParent',
            data: { parent: 'object', child: 'Email (pipeAsync())' },
          },
        ],
      },
      {
        code: `${NS}const Schema = v.array(v.optional(v.objectAsync({ id: v.string() })));`,
        errors: [
          {
            messageId: 'asyncSchemaInSyncParent',
            data: { parent: 'optional', child: 'objectAsync()' },
          },
        ],
      },
      {
        code: `${NS}const Schema = v.union([v.string(), v.objectAsync({})]);`,
        errors: [
          {
            messageId: 'asyncSchemaInSyncParent',
            data: { parent: 'union', child: 'objectAsync()' },
          },
        ],
      },
      {
        code: `${NS}const Schema = v.variant('type', [v.objectAsync({ type: v.literal('a') })]);`,
        errors: [
          {
            messageId: 'asyncSchemaInSyncParent',
            data: { parent: 'variant', child: 'objectAsync()' },
          },
        ],
      },
      {
        code: `${NS}const Schema = v.record(v.string(), ${ASYNC_EMAIL});`,
        errors: [
          {
            messageId: 'asyncSchemaInSyncParent',
            data: { parent: 'record', child: 'pipeAsync()' },
          },
        ],
      },
      {
        code: `${NS}const Schema = v.lazy(() => v.objectAsync({}));`,
        errors: [
          {
            messageId: 'asyncSchemaInSyncParent',
            data: { parent: 'lazy', child: 'objectAsync()' },
          },
        ],
      },
      {
        code: `${NS}const Schema = v.objectAsync({ email: ${ASYNC_EMAIL} });\nconst result = v.safeParse(Schema, input);`,
        errors: [
          {
            messageId: 'asyncSchemaInSyncParent',
            data: { parent: 'safeParse', child: 'Schema (objectAsync())' },
          },
        ],
      },
      {
        code: `${NS}const Schema = v.objectAsync({});\nif (v.is(Schema, input)) use(input);`,
        errors: [
          {
            messageId: 'asyncSchemaWithoutAsyncTwin',
            data: { parent: 'is', child: 'Schema (objectAsync())' },
          },
        ],
      },
      {
        code: `${NS}const Schema = v.pipe(v.objectAsync({}), v.check(() => true));`,
        errors: [
          {
            messageId: 'asyncSchemaInSyncParent',
            data: { parent: 'pipe', child: 'objectAsync()' },
          },
        ],
      },
    ],
  },
);
