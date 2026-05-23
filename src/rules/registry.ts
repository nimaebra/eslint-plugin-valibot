import type {
  ConfigName,
  RuleMap,
  RuleRegistryEntry,
  RulesConfig,
} from '../types';

import { requireIssueMessages } from './require-issue-messages';
import { consistentImport } from './consistent-import';
import { consistentSchemaConvention } from './consistent-schema-convention';
import { noRecreatedSchemas } from './no-recreated-schemas';
import { noDuplicatePipeActions } from './no-duplicate-pipe-actions';
import { noSchemaAsType } from './no-schema-as-type';
import { preferNullableOverUnionNull } from './prefer-nullable-over-union-null';
import { preferOptionalOverUnionUndefined } from './prefer-optional-over-union-undefined';
import { preferVariant } from './prefer-variant';
import { preferNullish } from './prefer-nullish';
import { noUnguardedParse } from './no-unguarded-parse';
import { noRedundantSchemaWrappers } from './no-redundant-schema-wrappers';
import { noAnySchema } from './no-any-schema';
import { noLooseObject } from './no-loose-object';
import { noUnknownSchema } from './no-unknown-schema';
import { noInstanceofBuiltins } from './no-instanceof-builtins';
import { noEmptyPipe } from './no-empty-pipe';
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
    name: 'prefer-nullable-over-union-null',
    rule: preferNullableOverUnionNull,
    configs: {
      recommended: 'warn',
      strict: 'warn',
    },
  },
  {
    name: 'prefer-optional-over-union-undefined',
    rule: preferOptionalOverUnionUndefined,
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
    name: 'require-issue-messages',
    rule: requireIssueMessages,
    configs: {
      strict: 'warn',
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
    name: 'consistent-import',
    rule: consistentImport,
    configs: {
      stylistic: 'warn',
    },
  },
  {
    name: 'consistent-schema-convention',
    rule: consistentSchemaConvention,
    configs: {
      stylistic: 'warn',
    },
  },
  {
    name: 'prefer-variant',
    rule: preferVariant,
    configs: {
      stylistic: 'warn',
    },
  },
  {
    name: 'no-loose-object',
    rule: noLooseObject,
    configs: {
      strict: 'warn',
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
