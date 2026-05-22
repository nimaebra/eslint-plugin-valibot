import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

const OBJECT_SCHEMA_NAMES = [
  'object',
  'objectAsync',
  'strictObject',
  'strictObjectAsync',
  'looseObject',
  'looseObjectAsync',
  'objectWithRest',
  'objectWithRestAsync',
] as const;

type Options = [];
type MessageIds = 'preferOptional';

export const preferOptionalOverUnionUndefined = createRule<Options, MessageIds>(
  {
    name: 'prefer-optional-over-union-undefined',
    meta: {
      type: 'suggestion',
      docs: {
        description:
          'Prefer optional() over union([schema, undefined()]) when they are equivalent.',
      },
      fixable: 'code',
      schema: [],
      messages: {
        preferOptional:
          'Prefer optional() instead of union([schema, undefined()]) when the schema only needs to accept undefined.',
      },
    },
    defaultOptions: [],
    create(context) {
      let imports = createEmptyValibotImports();
      const sourceCode = context.sourceCode;

      return {
        Program(node) {
          imports = collectValibotImports(node);
        },
        CallExpression(node) {
          if (
            !hasValibotImports(imports) ||
            !isValibotCall(node, imports, 'union')
          ) {
            return;
          }

          const matchedSchema = getMatchedSchema(node, imports);

          if (!matchedSchema || isWithinObjectSchemaEntry(node, imports)) {
            return;
          }

          const preferredCalleeText = getPreferredCalleeText(node, imports);

          context.report({
            node,
            messageId: 'preferOptional',
            fix: preferredCalleeText
              ? (fixer) =>
                  fixer.replaceText(
                    node,
                    `${preferredCalleeText}(${sourceCode.getText(matchedSchema)})`,
                  )
              : null,
          });
        },
      };
    },
  },
);

function getMatchedSchema(
  call: TSESTree.CallExpression,
  imports: ValibotImports,
): TSESTree.Expression | null {
  if (call.arguments.length !== 1) {
    return null;
  }

  const options = call.arguments[0];

  if (options?.type !== 'ArrayExpression' || options.elements.length !== 2) {
    return null;
  }

  const [firstOption, secondOption] = options.elements;

  if (!isSchemaOption(firstOption) || !isSchemaOption(secondOption)) {
    return null;
  }

  if (isUndefinedSchemaCall(firstOption, imports)) {
    return secondOption;
  }

  if (isUndefinedSchemaCall(secondOption, imports)) {
    return firstOption;
  }

  return null;
}

function isSchemaOption(
  node: TSESTree.ArrayExpression['elements'][number],
): node is TSESTree.Expression {
  return node !== null && node.type !== 'SpreadElement';
}

function isUndefinedSchemaCall(
  node: TSESTree.Expression,
  imports: ValibotImports,
): node is TSESTree.CallExpression {
  return (
    node.type === 'CallExpression' &&
    node.arguments.length === 0 &&
    isValibotCall(node, imports, 'undefined')
  );
}

function isWithinObjectSchemaEntry(
  node: TSESTree.Node,
  imports: ValibotImports,
): boolean {
  let current: TSESTree.Node | undefined = node;

  while (current?.parent) {
    const parent: TSESTree.Node = current.parent;

    if (parent.type === 'Property' && parent.value === current) {
      const objectLiteral = parent.parent;

      if (!objectLiteral || objectLiteral.type !== 'ObjectExpression') {
        return false;
      }

      const schemaCall = objectLiteral.parent;

      if (
        !schemaCall ||
        schemaCall.type !== 'CallExpression' ||
        schemaCall.arguments[0] !== objectLiteral
      ) {
        return false;
      }

      return OBJECT_SCHEMA_NAMES.some((schemaName) =>
        isValibotCall(schemaCall, imports, schemaName),
      );
    }

    current = parent;
  }

  return false;
}

function getPreferredCalleeText(
  call: TSESTree.CallExpression,
  imports: ValibotImports,
): string | null {
  if (call.callee.type === 'MemberExpression') {
    return `${sourceTextForMemberNamespace(call)}.optional`;
  }

  const localOptionalName = getLocalImportName(imports, 'optional');

  return localOptionalName ?? null;
}

function sourceTextForMemberNamespace(call: TSESTree.CallExpression): string {
  if (
    call.callee.type === 'MemberExpression' &&
    call.callee.object.type === 'Identifier'
  ) {
    return call.callee.object.name;
  }

  return 'v';
}

function getLocalImportName(
  imports: ValibotImports,
  importedName: string,
): string | undefined {
  for (const [localName, importedValue] of imports.importedNames) {
    if (importedValue === importedName) {
      return localName;
    }
  }

  return undefined;
}
