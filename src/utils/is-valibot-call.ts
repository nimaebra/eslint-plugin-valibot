import type { TSESTree } from '@typescript-eslint/utils';

import type { ValibotImports } from './collect-valibot-imports';

// Valibot exports reserved-word APIs twice, e.g. `null` and `null_`. Rules match
// on the canonical name, so the underscore aliases are normalized here.
const RESERVED_WORD_ALIASES = new Map([
  ['enum_', 'enum'],
  ['function_', 'function'],
  ['null_', 'null'],
  ['undefined_', 'undefined'],
  ['void_', 'void'],
]);

export function normalizeValibotApiName(name: string): string {
  return RESERVED_WORD_ALIASES.get(name) ?? name;
}

export function getValibotCallName(
  node: TSESTree.CallExpression,
  imports: ValibotImports,
): string | null {
  if (node.callee.type === 'Identifier') {
    const importedName = imports.importedNames.get(node.callee.name);

    return importedName === undefined
      ? null
      : normalizeValibotApiName(importedName);
  }

  if (
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.object.type === 'Identifier' &&
    node.callee.property.type === 'Identifier' &&
    imports.namespaces.has(node.callee.object.name)
  ) {
    return normalizeValibotApiName(node.callee.property.name);
  }

  return null;
}

export function isValibotCall(
  node: TSESTree.CallExpression,
  imports: ValibotImports,
  functionName: string,
): boolean {
  return getValibotCallName(node, imports) === functionName;
}

const ASYNC_SUFFIX = 'Async';

export interface ValibotCallVariant {
  /** The sync API name, e.g. `pipe` for both `pipe()` and `pipeAsync()`. */
  name: string;
  isAsync: boolean;
}

export function getValibotCallVariant(
  node: TSESTree.CallExpression,
  imports: ValibotImports,
): ValibotCallVariant | null {
  const name = getValibotCallName(node, imports);

  if (name === null) {
    return null;
  }

  return name.endsWith(ASYNC_SUFFIX)
    ? { name: name.slice(0, -ASYNC_SUFFIX.length), isAsync: true }
    : { name, isAsync: false };
}

/** Matches `functionName()` and its `functionNameAsync()` variant. */
export function isValibotCallOrAsync(
  node: TSESTree.CallExpression,
  imports: ValibotImports,
  functionName: string,
): boolean {
  return getValibotCallVariant(node, imports)?.name === functionName;
}

export function toAsyncApiName(name: string, isAsync: boolean): string {
  return isAsync ? `${name}${ASYNC_SUFFIX}` : name;
}
