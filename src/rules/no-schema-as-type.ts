import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { getSchemaBindingName } from '../utils/schema-identifiers';

const ALLOWED_INFER_TYPE_NAMES = new Set(['InferInput', 'InferOutput']);

type Options = [];
type MessageIds = 'noSchemaAsType';

export const noSchemaAsType = createRule<Options, MessageIds>({
  name: 'no-schema-as-type',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow using a Valibot schema value itself as a TypeScript type.',
    },
    schema: [],
    messages: {
      noSchemaAsType:
        'Use InferInput<typeof {{schemaName}}> or InferOutput<typeof {{schemaName}}> instead of typeof {{schemaName}}.',
    },
  },
  defaultOptions: [],
  create(context) {
    let imports = createEmptyValibotImports();
    const schemaBindings = new Set<string>();

    return {
      Program(node) {
        imports = collectValibotImports(node);
      },
      VariableDeclarator(node) {
        if (!hasValibotImports(imports)) {
          return;
        }

        const schemaBindingName = getSchemaBindingName(node, imports);

        if (schemaBindingName) {
          schemaBindings.add(schemaBindingName);
        }
      },
      TSTypeQuery(node) {
        if (
          !hasValibotImports(imports) ||
          isAllowedSchemaTypeQuery(node, imports)
        ) {
          return;
        }

        const schemaName = getSchemaTypeQueryName(node);

        if (!schemaName || !schemaBindings.has(schemaName)) {
          return;
        }

        context.report({
          node,
          messageId: 'noSchemaAsType',
          data: {
            schemaName,
          },
        });
      },
    };
  },
});

function getSchemaTypeQueryName(node: TSESTree.TSTypeQuery): string | null {
  return node.exprName.type === 'Identifier' ? node.exprName.name : null;
}

function isAllowedSchemaTypeQuery(
  node: TSESTree.TSTypeQuery,
  imports: ValibotImports,
): boolean {
  const parent = node.parent;

  if (!parent || parent.type !== 'TSTypeParameterInstantiation') {
    return false;
  }

  const typeReference = parent.parent;

  if (!typeReference || typeReference.type !== 'TSTypeReference') {
    return false;
  }

  return isAllowedInferReference(typeReference.typeName, imports);
}

function isAllowedInferReference(
  typeName: TSESTree.EntityName,
  imports: ValibotImports,
): boolean {
  if (typeName.type === 'Identifier') {
    return ALLOWED_INFER_TYPE_NAMES.has(
      imports.importedNames.get(typeName.name) ?? '',
    );
  }

  if (typeName.type !== 'TSQualifiedName') {
    return false;
  }

  return (
    typeName.left.type === 'Identifier' &&
    imports.namespaces.has(typeName.left.name) &&
    ALLOWED_INFER_TYPE_NAMES.has(typeName.right.name)
  );
}
