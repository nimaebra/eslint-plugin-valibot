import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';

import plugin from '../../src/plugin';
import * as ruleExports from '../../src/rules';
import { getRuleNamesForConfig, ruleRegistry } from '../../src/rules';

describe('plugin config exports', () => {
  it('registers every implemented rule exactly once', () => {
    const implementedNames = readdirSync(
      new URL('../../src/rules', import.meta.url),
    )
      .filter(
        (name) =>
          name.endsWith('.ts') && name !== 'index.ts' && name !== 'registry.ts',
      )
      .map((name) => name.slice(0, -3))
      .sort();
    const registeredNames = ruleRegistry.map(({ name }) => name).sort();

    expect(registeredNames).toEqual(implementedNames);
    expect(new Set(registeredNames).size).toBe(registeredNames.length);
  });

  it('exports every registered rule from the rule barrel', () => {
    for (const { name, rule } of ruleRegistry) {
      expect(Object.values(ruleExports), name).toContain(rule);
    }
  });

  it.each(['all', 'recommended', 'strict', 'stylistic'] as const)(
    'lists the enabled %s rules through the public registry helper',
    (preset) => {
      const names = getRuleNamesForConfig(preset);
      const enabledNames = Object.keys(plugin.configs[preset].rules ?? {})
        .map((name) => name.replace('valibot/', ''))
        .sort();

      expect(names).toEqual(enabledNames);
      expect(new Set(names).size).toBe(names.length);
    },
  );

  it('keeps recommended flat and legacy rules in sync', () => {
    const flatRecommendedRules = plugin.flatConfigs.recommended[0]?.rules;
    const legacyRecommendedRules = plugin.configs.recommended.rules;

    expect(flatRecommendedRules).toEqual(legacyRecommendedRules);
  });

  it('keeps strict flat and legacy rules in sync', () => {
    const flatStrictRules = plugin.flatConfigs.strict[0]?.rules;
    const legacyStrictRules = plugin.configs.strict.rules;

    expect(flatStrictRules).toEqual(legacyStrictRules);
  });

  it('keeps stylistic flat and legacy rules in sync', () => {
    const flatStylisticRules = plugin.flatConfigs.stylistic[0]?.rules;
    const legacyStylisticRules = plugin.configs.stylistic.rules;

    expect(flatStylisticRules).toEqual(legacyStylisticRules);
  });

  it('keeps all flat and legacy rules in sync', () => {
    expect(plugin.flatConfigs.all[0]?.rules).toEqual(plugin.configs.all.rules);
  });

  it('enables every rule as an error in the all config', () => {
    expect(plugin.configs.all.rules).toEqual(
      Object.fromEntries(
        ruleRegistry.map(({ name }) => [`valibot/${name}`, 'error']),
      ),
    );
  });

  it.each([
    'no-async-callback-in-sync-validation',
    'no-object-reshape-after-pipe',
    'no-truthy-string-coercion',
    'prefer-exact-pipe-constraint',
  ])('keeps %s opt-in outside the all config', (name) => {
    const key = `valibot/${name}`;
    expect(plugin.configs.all.rules?.[key]).toBe('error');
    for (const preset of ['recommended', 'strict', 'stylistic'] as const) {
      expect(plugin.configs[preset].rules?.[key]).toBeUndefined();
    }
  });

  it('exposes all implemented rules', () => {
    expect(Object.keys(plugin.rules).sort()).toEqual(
      ruleRegistry.map(({ name }) => name).sort(),
    );
  });
});
