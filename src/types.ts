import type { TSESLint } from '@typescript-eslint/utils';

export type RuleModule = TSESLint.RuleModule<string, readonly unknown[]>;
export type RuleMap = Record<string, RuleModule>;
export type RuleSeverity = 'off' | 'warn' | 'error' | 0 | 1 | 2;
export type RuleEntry = RuleSeverity | readonly [RuleSeverity, ...unknown[]];
export type RulesConfig = Record<string, RuleEntry>;
export type ConfigName = 'recommended' | 'strict' | 'stylistic';

export interface RuleRegistryEntry {
  name: string;
  rule: RuleModule;
  configs: Partial<Record<ConfigName, RuleEntry>>;
  typeScriptOnly?: boolean;
}

export interface FlatConfig {
  name?: string;
  files?: string[];
  ignores?: string[];
  plugins?: Record<string, unknown>;
  rules?: RulesConfig;
  languageOptions?: Record<string, unknown>;
}

export type FlatConfigArray = FlatConfig[];

export interface LegacyConfig {
  plugins?: string[];
  extends?: string[];
  rules?: RulesConfig;
  overrides?: Array<Record<string, unknown>>;
}

export type LegacyConfigMap = Record<string, LegacyConfig>;
export type FlatConfigMap = Record<string, FlatConfigArray>;

export interface FlatPluginShape {
  meta: {
    name: string;
    version?: string;
  };
  rules: RuleMap;
}

export interface ValibotPlugin extends FlatPluginShape {
  configs: LegacyConfigMap;
  flatConfigs: FlatConfigMap;
}
