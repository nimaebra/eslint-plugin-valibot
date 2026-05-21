import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotSchemaExpression } from '../utils/is-schema-expression';

type Options = [];
type MessageIds = 'noRecreatedSchema';

export const noRecreatedSchemas = createRule<Options, MessageIds>({
  name: 'no-recreated-schemas',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow recreating static Valibot schemas inside function scope.',
    },
    schema: [],
    messages: {
      noRecreatedSchema:
        'This schema is recreated on every call. Hoist it to module scope unless it truly depends on runtime inputs.',
    },
  },
  defaultOptions: [],
  create(context) {
    let imports = createEmptyValibotImports();

    return {
      Program(node) {
        imports = collectValibotImports(node);
      },
      VariableDeclarator(node) {
        if (
          node.id.type !== 'Identifier' ||
          !isStaticSchemaRecreation(node.init, imports)
        ) {
          return;
        }

        context.report({
          node: node.id,
          messageId: 'noRecreatedSchema',
        });
      },
      ReturnStatement(node) {
        if (!isStaticSchemaRecreation(node.argument, imports)) {
          return;
        }

        context.report({
          node: node.argument,
          messageId: 'noRecreatedSchema',
        });
      },
      ArrowFunctionExpression(node) {
        if (
          node.body.type === 'BlockStatement' ||
          !isStaticSchemaRecreation(node.body, imports)
        ) {
          return;
        }

        context.report({
          node: node.body,
          messageId: 'noRecreatedSchema',
        });
      },
    };
  },
});

function isStaticSchemaRecreation(
  node: TSESTree.Expression | null | undefined,
  imports: ValibotImports,
): node is TSESTree.CallExpression {
  return (
    hasValibotImports(imports) &&
    isValibotSchemaExpression(node, imports) &&
    findEnclosingFunction(node) !== null &&
    !containsNestedFunction(node) &&
    !hasDynamicSchemaInputs(node, imports)
  );
}

function findEnclosingFunction(
  node: TSESTree.Node,
):
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | null {
  let current: TSESTree.Node | undefined = node.parent;

  while (current) {
    if (isFunctionLike(current)) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

function containsNestedFunction(node: TSESTree.Node): boolean {
  return traverseNode(
    node,
    (childNode) => childNode !== node && isFunctionLike(childNode),
  );
}

function hasDynamicSchemaInputs(
  node: TSESTree.Node,
  imports: ValibotImports,
): boolean {
  return traverseNode(node, (childNode, parentNode) => {
    if (childNode === node || childNode.type !== 'Identifier') {
      return false;
    }

    if (
      imports.importedNames.has(childNode.name) ||
      imports.namespaces.has(childNode.name)
    ) {
      return false;
    }

    if (
      parentNode?.type === 'MemberExpression' &&
      parentNode.property === childNode &&
      !parentNode.computed
    ) {
      return false;
    }

    if (
      parentNode?.type === 'Property' &&
      parentNode.key === childNode &&
      !parentNode.computed
    ) {
      return false;
    }

    return true;
  });
}

function isFunctionLike(
  node: TSESTree.Node,
): node is
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  );
}

function traverseNode(
  node: TSESTree.Node,
  predicate: (node: TSESTree.Node, parent?: TSESTree.Node) => boolean,
  parent?: TSESTree.Node,
): boolean {
  if (predicate(node, parent)) {
    return true;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent' || value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item) && traverseNode(item, predicate, node)) {
          return true;
        }
      }

      continue;
    }

    if (isNode(value) && traverseNode(value, predicate, node)) {
      return true;
    }
  }

  return false;
}

function isNode(value: unknown): value is TSESTree.Node {
  return typeof value === 'object' && value !== null && 'type' in value;
}
