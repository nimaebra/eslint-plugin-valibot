import type {
  ConfigName,
  RuleMap,
  RuleRegistryEntry,
  RulesConfig,
} from '../types';

import { requireDefaultInOptionalPipe } from './require-default-in-optional-pipe';
import { requireIssueMessages } from './require-issue-messages';
import { requireSafeParseSuccessCheck } from './require-safe-parse-success-check';
import { noRecreatedSchemas } from './no-recreated-schemas';
import { noDuplicatePipeActions } from './no-duplicate-pipe-actions';
import { noSchemaAsType } from './no-schema-as-type';
import { schemaNameSuffix } from './schema-name-suffix';
import { preferNullish } from './prefer-nullish';
import { noUnguardedParse } from './no-unguarded-parse';
import { noRedundantSchemaWrappers } from './no-redundant-schema-wrappers';
import { noAnySchema } from './no-any-schema';
import { noUnknownSchema } from './no-unknown-schema';
import { noLazyNonFunction } from './no-lazy-non-function';
import { noInstanceofBuiltins } from './no-instanceof-builtins';
import { noEmptyPipe } from './no-empty-pipe';
import { noSchemaAsPipeAction } from './no-schema-as-pipe-action';
import { noTransformInRecordKey } from './no-transform-in-record-key';

export const ruleRegistry: RuleRegistryEntry[] = [
  {
    name: 'no-any-schema',
    rule: noAnySchema,
    configs: {
      strict: 'warn',
    },
  },
  {
    name: 'no-unknown-schema',
    rule: noUnknownSchema,
    configs: {
      strict: 'warn',
    },
  },
  {
    name: 'no-unguarded-parse',
    rule: noUnguardedParse,
    configs: {
      recommended: 'error',
      strict: 'error',
    },
  },
  {
    name: 'no-redundant-schema-wrappers',
    rule: noRedundantSchemaWrappers,
    configs: {
      recommended: 'error',
      strict: 'error',
    },
  },
  {
    name: 'prefer-nullish',
    rule: preferNullish,
    configs: {
      recommended: 'warn',
      strict: 'warn',
    },
  },
  {
    name: 'no-duplicate-pipe-actions',
    rule: noDuplicatePipeActions,
    configs: {
      recommended: 'warn',
      strict: 'warn',
    },
  },
  {
    name: 'require-default-in-optional-pipe',
    rule: requireDefaultInOptionalPipe,
    configs: {
      recommended: 'warn',
      strict: 'warn',
    },
  },
  {
    name: 'require-issue-messages',
    rule: requireIssueMessages,
    configs: {
      strict: 'warn',
    },
  },
  {
    name: 'require-safe-parse-success-check',
    rule: requireSafeParseSuccessCheck,
    configs: {
      recommended: 'error',
      strict: 'error',
    },
  },
  {
    name: 'no-recreated-schemas',
    rule: noRecreatedSchemas,
    configs: {
      strict: 'warn',
    },
  },
  {
    name: 'no-schema-as-type',
    rule: noSchemaAsType,
    configs: {
      strict: 'error',
    },
    typeScriptOnly: true,
  },
  {
    name: 'schema-name-suffix',
    rule: schemaNameSuffix,
    configs: {
      stylistic: 'warn',
    },
  },
  {
    name: 'no-lazy-non-function',
    rule: noLazyNonFunction,
    configs: {
      recommended: 'error',
      strict: 'error',
    },
  },
  {
    name: 'no-instanceof-builtins',
    rule: noInstanceofBuiltins,
    configs: {
      recommended: 'error',
      strict: 'error',
    },
  },
  {
    name: 'no-empty-pipe',
    rule: noEmptyPipe,
    configs: {
      recommended: 'error',
      strict: 'error',
    },
  },
  {
    name: 'no-transform-in-record-key',
    rule: noTransformInRecordKey,
    configs: {
      recommended: 'error',
      strict: 'error',
    },
  },
  {
    name: 'no-schema-as-pipe-action',
    rule: noSchemaAsPipeAction,
    configs: {
      recommended: 'error',
      strict: 'error',
    },
  },
];

export const rules = Object.fromEntries(
  ruleRegistry.map(({ name, rule }) => [name, rule]),
) as RuleMap;

export function getRulesForConfig(configName: ConfigName): RulesConfig {
  return Object.fromEntries(
    ruleRegistry.flatMap(({ name, configs }) => {
      const entry = configs[configName];

      return entry ? [[`valibot/${name}`, entry]] : [];
    }),
  );
}

export function getRuleNamesForConfig(configName: ConfigName): string[] {
  return ruleRegistry
    .filter(({ configs }) => configName in configs)
    .map(({ name }) => name)
    .sort();
}
