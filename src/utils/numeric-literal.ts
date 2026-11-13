import type { TSESTree } from '@typescript-eslint/utils';

export function getNumericLiteral(
  node: TSESTree.Node | undefined,
): number | undefined {
  if (node?.type === 'UnaryExpression' && node.operator === '-') {
    const value = getUnsignedLiteral(node.argument);
    return value === undefined ? undefined : -value;
  }
  return getUnsignedLiteral(node);
}

function getUnsignedLiteral(node: TSESTree.Node | undefined) {
  if (
    node?.type === 'Literal' &&
    typeof node.value === 'number' &&
    Number.isFinite(node.value)
  ) {
    return node.value;
  }
}
