import type { TSESTree } from '@typescript-eslint/utils';

import type { ValibotImports } from './collect-valibot-imports';
import { isValibotSchemaExpression } from './is-schema-expression';

export function getSchemaBindingName(
  node: TSESTree.VariableDeclarator,
  imports: ValibotImports,
): string | null {
  if (
    node.id.type !== 'Identifier' ||
    !isValibotSchemaExpression(node.init, imports)
  ) {
    return null;
  }

  return node.id.name;
}
