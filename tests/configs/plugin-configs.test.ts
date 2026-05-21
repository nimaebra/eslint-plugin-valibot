import { describe, expect, it } from 'vitest';

import plugin from '../../src/plugin';
import { ruleRegistry } from '../../src/rules';

describe('plugin config exports', () => {
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

  it('exposes all implemented rules', () => {
    expect(Object.keys(plugin.rules).sort()).toEqual(
      ruleRegistry.map(({ name }) => name).sort(),
    );
  });
});
