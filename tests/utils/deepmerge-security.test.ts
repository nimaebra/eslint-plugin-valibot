import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

// Resolve the exact dependency used by the docs CLI, rather than a separate
// direct dependency that could hide an unpatched transitive installation.
const require = createRequire(import.meta.url);
const requireFromDocs = createRequire(
  require.resolve('eslint-doc-generator/package.json'),
);
type Merge = (target: unknown, source: unknown) => Record<string, unknown>;

function maliciousObject(): Record<string, unknown> {
  return JSON.parse('{"__proto__":{"isAdmin":true},"safe":"value"}');
}

function expectSafe(result: Record<string, unknown>) {
  expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  expect(result.isAdmin).toBeUndefined();
  expect(Object.hasOwn(result, '__proto__')).toBe(false);
  expect(result.safe).toBe('value');
}

describe.each(['deepmerge', 'deepmerge/dist/umd.js'])(
  'patched %s: GHSA-gcqx-w48m-w2h4',
  (entrypoint) => {
    const merge = requireFromDocs(entrypoint) as Merge;
    it.each([
      ['ordinary object', (): unknown => ({})],
      ['null-prototype object', (): unknown => Object.create(null)],
      ['null', (): unknown => null],
      ['primitive', (): unknown => 0],
      ['own __proto__ property', maliciousObject],
    ] as const)(
      'rejects source prototype poisoning with a %s target',
      (_name, target) => {
        expectSafe(merge(target(), maliciousObject()));
      },
    );

    it('rejects prototype poisoning through the target-copy path', () => {
      expectSafe(merge(maliciousObject(), {}));
    });

    it('rejects nested prototype poisoning over a null placeholder', () => {
      const result = merge({ session: null }, { session: maliciousObject() });

      expectSafe(result.session as Record<string, unknown>);
    });

    it.each(['constructor', 'prototype'])(
      'rejects the reserved %s key on both sides',
      (key) => {
        const malicious = { [key]: { isAdmin: true }, safe: 'value' };

        expect(Object.hasOwn(merge(malicious, {}), key)).toBe(false);
        expect(Object.hasOwn(merge(Object.create(null), malicious), key)).toBe(
          false,
        );
      },
    );

    it('preserves recursive option merging, array concatenation, and callbacks', () => {
      const callback = () => 'docs/rules/custom.md';
      const target = { options: { check: false }, columns: ['name'], callback };
      const source = {
        options: { check: true, title: 'Rules' },
        columns: ['description'],
      };

      expect(merge(target, source)).toEqual({
        options: { check: true, title: 'Rules' },
        columns: ['name', 'description'],
        callback,
      });
      expect(target).toEqual({
        options: { check: false },
        columns: ['name'],
        callback,
      });
      expect(source.columns).toEqual(['description']);
    });
  },
);
