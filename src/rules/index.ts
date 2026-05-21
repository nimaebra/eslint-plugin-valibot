import { preferNamedSchema } from './prefer-named-schema';
import { requireSafeParseSuccessCheck } from './require-safe-parse-success-check';
import { requireDefaultInOptionalPipe } from './require-default-in-optional-pipe';
import { noDuplicatePipeActions } from './no-duplicate-pipe-actions';
import { noRecreatedSchemas } from './no-recreated-schemas';
import { noSchemaAsType } from './no-schema-as-type';
import { schemaNameSuffix } from './schema-name-suffix';
import { preferNullish } from './prefer-nullish';
import { noUnguardedParse } from './no-unguarded-parse';
import { noRedundantSchemaWrappers } from './no-redundant-schema-wrappers';
import { noAnySchema } from './no-any-schema';
import {
  getRuleNamesForConfig,
  getRulesForConfig,
  ruleRegistry,
  rules,
} from './registry';

export {
  getRuleNamesForConfig,
  getRulesForConfig,
  noAnySchema,
  noDuplicatePipeActions,
  noRecreatedSchemas,
  noSchemaAsType,
  noUnguardedParse,
  noRedundantSchemaWrappers,
  schemaNameSuffix,
  preferNamedSchema,
  preferNullish,
  requireDefaultInOptionalPipe,
  requireSafeParseSuccessCheck,
  ruleRegistry,
  rules,
};
