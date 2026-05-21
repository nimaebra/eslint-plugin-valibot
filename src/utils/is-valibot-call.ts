import type { TSESTree } from '@typescript-eslint/utils';

import type { ValibotImports } from './collect-valibot-imports';

export function getValibotCallName(
  node: TSESTree.CallExpression,
  imports: ValibotImports,
): string | null {
  if (node.callee.type === 'Identifier') {
    return imports.importedNames.get(node.callee.name) ?? null;
  }

  if (
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.object.type === 'Identifier' &&
    node.callee.property.type === 'Identifier' &&
    imports.namespaces.has(node.callee.object.name)
  ) {
    return node.callee.property.name;
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
