import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { getReferencedVariable } from './referenced-variable';

/** Follow local const aliases and stable function declarations by binding. */
export function resolveLocalInitializer(
  node: TSESTree.Node | undefined,
  sourceCode: Readonly<TSESLint.SourceCode>,
): TSESTree.Node | undefined {
  const visited = new Set<TSESLint.Scope.Variable>();

  while (node) {
    switch (node.type) {
      case 'TSAsExpression':
      case 'TSInstantiationExpression':
      case 'TSNonNullExpression':
      case 'TSSatisfiesExpression':
      case 'TSTypeAssertion':
        node = node.expression;
        continue;
      case 'Identifier': {
        const variable = getReferencedVariable(sourceCode, node);
        if (!variable || variable.defs.length !== 1 || visited.has(variable))
          return undefined;
        visited.add(variable);

        const [definition] = variable.defs;
        if (
          definition.type === 'FunctionName' &&
          definition.node.type === 'FunctionDeclaration' &&
          !variable.references.some((ref) => ref.isWrite() && !ref.init)
        ) {
          return definition.node;
        }
        if (
          definition.type !== 'Variable' ||
          definition.parent.kind !== 'const' ||
          definition.node.id.type !== 'Identifier'
        ) {
          return undefined;
        }
        node = definition.node.init ?? undefined;
        continue;
      }
      default:
        return node;
    }
  }

  return undefined;
}
