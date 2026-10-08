import type { TSESTree } from '@typescript-eslint/utils';

import type { ValibotImports } from './collect-valibot-imports';
import { getValibotCallVariant } from './is-valibot-call';

export const SCHEMA_CALL_NAMES = new Set([
  'any',
  'array',
  'bigint',
  'blob',
  'boolean',
  'cache',
  'config',
  'custom',
  'date',
  'enum',
  'exactOptional',
  'fallback',
  'file',
  'function',
  'instance',
  'intersect',
  'keyof',
  'lazy',
  'literal',
  'looseObject',
  'looseTuple',
  'map',
  'message',
  'nan',
  'never',
  'nonNullable',
  'nonNullish',
  'nonOptional',
  'null',
  'nullable',
  'nullish',
  'number',
  'object',
  'objectWithRest',
  'omit',
  'optional',
  'partial',
  'pick',
  'picklist',
  'pipe',
  'promise',
  'readonly',
  'record',
  'required',
  'set',
  'strictObject',
  'strictTuple',
  'string',
  'symbol',
  'tuple',
  'tupleWithRest',
  'undefined',
  'undefinedable',
  'union',
  'unknown',
  'unwrap',
  'variant',
  'void',
]);

export function isValibotSchemaExpression(
  node: TSESTree.Node | null | undefined,
  imports: ValibotImports,
): node is TSESTree.CallExpression {
  return node?.type === 'CallExpression' && isValibotSchemaCall(node, imports);
}

function isValibotSchemaCall(
  node: TSESTree.CallExpression,
  imports: ValibotImports,
): boolean {
  const variant = getValibotCallVariant(node, imports);

  return variant !== null && SCHEMA_CALL_NAMES.has(variant.name);
}
