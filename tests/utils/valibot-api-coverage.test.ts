import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { ASYNC_PIPE_ACTIONS } from '../../src/rules/no-async-action-in-sync-pipe';
import { SCHEMA_CALL_NAMES } from '../../src/utils/is-schema-expression';
import { getIssueMessageParameterIndex } from '../../src/utils/issue-message-signatures';
import { normalizeValibotApiName } from '../../src/utils/is-valibot-call';

// These tests probe the installed Valibot at runtime so that new or changed
// APIs fail CI instead of silently slipping past the plugin's lookup tables.

type ValibotFunction = (...args: unknown[]) => unknown;

interface ProbedObject {
  kind?: unknown;
  async?: unknown;
  message?: unknown;
}

const SENTINEL_MESSAGE = '__eslint_plugin_valibot_sentinel__';

// Placeholder arguments that satisfy the constructors of Valibot APIs that
// inspect their requirement eagerly (e.g. `picklist()` or `hash()`).
const FILLERS: unknown[] = [
  undefined,
  [v.string(), v.number()],
  ['a', 'b'],
  ['md5'],
  v.object({ a: v.string() }),
  /x/u,
  Date,
  v.string(),
  'x',
  () => true,
];

const ARGUMENT_PREFIXES: unknown[][] = [
  [],
  ...FILLERS.map((filler) => [filler]),
  ...FILLERS.flatMap((first) => FILLERS.map((second) => [first, second])),
];

// `required()` stores its message on the wrapped entries instead of on the
// returned schema, so the runtime probe cannot observe it.
const MESSAGE_INDEX_OVERRIDES = new Map([
  ['required', 1],
  ['requiredAsync', 1],
]);

// `forward()` returns the action it wraps, so it only looks like a schema.
const NON_SCHEMA_NAMES = new Set(['forward', 'forwardAsync']);

const valibotFunctions = Object.entries(v).filter(
  (entry): entry is [string, ValibotFunction] =>
    typeof entry[1] === 'function' && /^[a-z]/u.test(entry[0]),
);

function tryCall(
  fn: ValibotFunction,
  args: unknown[],
): ProbedObject | undefined {
  try {
    const result = fn(...args);

    if (result instanceof Promise) {
      result.catch(() => undefined);
      return undefined;
    }

    return typeof result === 'object' && result !== null
      ? (result as ProbedObject)
      : undefined;
  } catch {
    return undefined;
  }
}

function probeMessageIndex(fn: ValibotFunction): number | null {
  for (const prefix of ARGUMENT_PREFIXES) {
    const result = tryCall(fn, [...prefix, SENTINEL_MESSAGE]);

    if (result?.message === SENTINEL_MESSAGE) {
      return prefix.length;
    }
  }

  return null;
}

function probeKind(fn: ValibotFunction): ProbedObject | undefined {
  for (const prefix of ARGUMENT_PREFIXES) {
    const result = tryCall(fn, prefix);

    if (typeof result?.kind === 'string') {
      return result;
    }
  }

  return undefined;
}

describe('Valibot API coverage', () => {
  it('classifies the issue message argument of every Valibot API', () => {
    const mismatches: string[] = [];
    let messageApiCount = 0;

    for (const [name, fn] of valibotFunctions) {
      const expected =
        MESSAGE_INDEX_OVERRIDES.get(name) ?? probeMessageIndex(fn);
      const actual = getIssueMessageParameterIndex(
        normalizeValibotApiName(name),
      );

      if (expected !== null) {
        messageApiCount += 1;
      }

      if (expected !== actual) {
        mismatches.push(`${name}: valibot=${expected} plugin=${actual}`);
      }
    }

    expect(messageApiCount).toBeGreaterThan(100);
    expect(mismatches).toEqual([]);
  });

  it('recognizes every Valibot schema constructor', () => {
    const missing = valibotFunctions
      .filter(
        ([name, fn]) =>
          !NON_SCHEMA_NAMES.has(name) && probeKind(fn)?.kind === 'schema',
      )
      .map(([name]) => normalizeValibotApiName(name).replace(/Async$/u, ''))
      .filter((name) => !SCHEMA_CALL_NAMES.has(name));

    expect(missing).toEqual([]);
  });

  it('knows every async pipe action', () => {
    const missing = valibotFunctions
      .filter(([, fn]) => {
        const result = probeKind(fn);

        return (
          result?.async === true &&
          (result.kind === 'validation' || result.kind === 'transformation')
        );
      })
      .map(([name]) => name)
      .filter((name) => !ASYNC_PIPE_ACTIONS.has(name));

    expect(missing).toEqual([]);
  });
});
