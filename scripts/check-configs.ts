import { getRulesForConfig } from '../src/rules';
import plugin from '../src/plugin';

assertConfigSync('recommended');
assertConfigSync('strict');
assertConfigSync('stylistic');

function assertConfigSync(configName: 'recommended' | 'strict' | 'stylistic') {
  const expectedRules = getRulesForConfig(configName);
  const flatRules = plugin.flatConfigs[configName][0]?.rules ?? {};
  const legacyRules = plugin.configs[configName].rules ?? {};

  assertRulesEqual(configName, 'flat', flatRules, expectedRules);
  assertRulesEqual(configName, 'legacy', legacyRules, expectedRules);
}

function assertRulesEqual(
  configName: 'recommended' | 'strict' | 'stylistic',
  sourceName: 'flat' | 'legacy',
  actualRules: Record<string, unknown>,
  expectedRules: Record<string, unknown>,
) {
  const actualRuleKeys = Object.keys(actualRules).sort();
  const expectedRuleKeys = Object.keys(expectedRules).sort();

  if (JSON.stringify(actualRuleKeys) !== JSON.stringify(expectedRuleKeys)) {
    throw new Error(
      `${configName} ${sourceName} rule keys differ from registry: ${actualRuleKeys.join(', ')} !== ${expectedRuleKeys.join(', ')}`,
    );
  }

  for (const ruleKey of actualRuleKeys) {
    if (actualRules[ruleKey] !== expectedRules[ruleKey]) {
      throw new Error(
        `${configName} ${sourceName} mismatch for ${ruleKey}: ${String(actualRules[ruleKey])} !== ${String(expectedRules[ruleKey])}`,
      );
    }
  }
}
