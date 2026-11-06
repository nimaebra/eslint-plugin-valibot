import { describe, expect, it } from 'vitest';
import {
  evaluateRuleCode,
  fixRule,
  suggestRule,
} from '../helpers/rule-runtime';

describe('schema fix semantics', () => {
  it.each([
    [
      'no-redundant-schema-wrappers',
      'v.optional(/* keep */ v.optional(v.string()))',
    ],
    ['prefer-nullish', 'v.optional(/* keep */ v.nullable(v.string()))'],
    [
      'prefer-nullable-over-union-null',
      'v.union([v.string(), /* keep */ v.null()])',
    ],
    [
      'prefer-optional-over-union-undefined',
      'v.union([v.string(), /* keep */ v.undefined()])',
    ],
  ])('%s retains comments', (rule, expression) => {
    const code = `const v = require('valibot'); const Schema = ${expression};`;
    const result = fixRule(rule, code);
    expect(result.fixed).toBe(false);
    expect(result.output).toBe(code);
    expect(result.messages).toHaveLength(1);
  });
  it.each([
    ['no-redundant-schema-wrappers', 'v.optional(v.optional(v.string()))'],
    ['prefer-nullish', 'v.optional(v.nullable(v.string()))'],
    ['prefer-nullish', 'v.nullableAsync(v.optionalAsync(v.string()))'],
    [
      'prefer-flatten-pipe',
      'v.pipe(v.pipe(v.string(), v.trim()), v.minLength(1))',
    ],
  ])(
    '%s preserves output, issues, and async shape',
    async (rule, expression) => {
      const code = `const v = require('valibot'); const Schema = ${expression}; ({ async: Schema.async, parse: async (input) => { const result = await v.safeParseAsync(Schema, input); return { success: result.success, output: result.output, messages: result.issues?.map(issue => issue.message) }; } });`;
      const fixed = fixRule(rule, code);
      expect(fixed.fixed).toBe(true);
      expect(fixed.messages).toEqual([]);
      const before = evaluateRuleCode(code) as {
        async: boolean;
        parse: (input: unknown) => Promise<unknown>;
      };
      const after = evaluateRuleCode(fixed.output) as typeof before;
      expect(after.async).toBe(before.async);
      for (const input of [undefined, null, '', '  ', ' hello ', 42]) {
        expect(await after.parse(input)).toEqual(await before.parse(input));
      }
      expect(fixRule(rule, fixed.output).fixed).toBe(false);
    },
  );

  it.each([
    ['prefer-nullish', "v.optional(v.nullable(v.string()), 'default')"],
    [
      'no-redundant-schema-wrappers',
      "v.optional(v.optional(v.string(), 'inner'), 'outer')",
    ],
  ])('%s leaves wrapper defaults intact', (rule, expression) => {
    const code = `const v = require('valibot'); const Schema = ${expression}; v.parse(Schema, undefined);`;
    const fixed = fixRule(rule, code);
    expect(fixed.fixed).toBe(false);
    expect(evaluateRuleCode(fixed.output)).toBe(
      rule === 'prefer-nullish' ? 'default' : 'outer',
    );
  });

  it.each([
    ['v.unknown()', '[]', 'undefined', 'value.push("changed")'],
    ['v.any()', '{}', 'undefined', 'value.changed = true'],
    ['v.date()', 'new Date(0)', 'undefined', 'value.setTime(42)'],
  ])(
    'a factory gives %s independent defaults across parses',
    (schema, value, input, mutation) => {
      const code = `const v = require('valibot'); const Schema = v.optional(${schema}, ${value}); const first = v.parse(Schema, ${input}); const value = first; ${mutation}; const second = v.parse(Schema, ${input}); first === second;`;
      expect(evaluateRuleCode(code)).toBe(true);
      const suggested = suggestRule('no-shared-mutable-default', code);
      expect(evaluateRuleCode(suggested)).toBe(false);
    },
  );
});
