import type { ConfigName, RuleEntry } from '../src/types';

import { getRulesForConfig } from '../src/rules';

const configNames: ConfigName[] = ['recommended', 'strict', 'stylistic', 'all'];

const CONFIG_INTROS: Partial<Record<ConfigName, string>> = {
  all: 'Enables every rule as an error. New rules join this config in minor releases, so expect new reports when upgrading.',
};

export function generateConfigsDoc(): string {
  const sections = configNames.map((configName) =>
    buildConfigSection(configName),
  );

  return `# Configs

This file is generated from \`src/rules/registry.ts\` by \`pnpm docs:build\`.

${sections.join('\n\n')}
`;
}

function buildConfigSection(configName: ConfigName): string {
  const rules = Object.entries(getRulesForConfig(configName)).sort(
    ([leftName], [rightName]) => leftName.localeCompare(rightName),
  );

  if (rules.length === 0) {
    return `## ${configName}\n\nCurrently includes no rules.`;
  }

  const ruleLines = rules
    .map(
      ([ruleName, severity]) =>
        `- \`${ruleName}\`: \`${formatRuleEntry(severity)}\``,
    )
    .join('\n');

  const intro = CONFIG_INTROS[configName];

  return `## ${configName}\n\n${intro ? `${intro}\n\n` : ''}Includes:\n\n${ruleLines}`;
}

function formatRuleEntry(ruleEntry: RuleEntry): string {
  return Array.isArray(ruleEntry)
    ? JSON.stringify(ruleEntry)
    : String(ruleEntry);
}
