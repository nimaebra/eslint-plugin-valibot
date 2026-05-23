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
  'strictObject',
  'looseObject',
  'objectWithRest',
] as const;

type Options = [];
type MessageIds = 'preferVariant';

export const preferVariant = createRule<Options, MessageIds>({
  name: 'prefer-variant',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer variant() over union() when object schemas share an obvious discriminant key.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferVariant:
        "Prefer variant('{{key}}', [...]) over union([...]) for discriminated object schemas.",
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

        const optionsArray = node.arguments[0];

        if (optionsArray?.type !== 'ArrayExpression') {
          return;
        }

        const optionCalls = getOptionObjectSchemaCalls(optionsArray, imports);

        if (!optionCalls) {
          return;
        }

        const discriminantKey = getCommonDiscriminantKey(optionCalls, imports);

        if (!discriminantKey) {
          return;
        }

        const preferredCalleeText = getPreferredCalleeText(node, imports);

        context.report({
          node,
          messageId: 'preferVariant',
          data: {
            key: discriminantKey,
          },
          fix:
            preferredCalleeText && node.arguments.length === 1
              ? (fixer) =>
                  fixer.replaceText(
                    node,
                    `${preferredCalleeText}(${toSingleQuotedString(discriminantKey)}, ${sourceCode.getText(optionsArray)})`,
                  )
              : null,
        });
      },
    };
  },
});

function getOptionObjectSchemaCalls(
  optionsArray: TSESTree.ArrayExpression,
  imports: ValibotImports,
): TSESTree.CallExpression[] | null {
  if (optionsArray.elements.length < 2) {
    return null;
  }

  const optionCalls: TSESTree.CallExpression[] = [];

  for (const element of optionsArray.elements) {
    if (!element || element.type === 'SpreadElement') {
      return null;
    }

    if (element.type !== 'CallExpression') {
      return null;
    }

    if (
      !OBJECT_SCHEMA_NAMES.some((name) => isValibotCall(element, imports, name))
    ) {
      return null;
    }

    optionCalls.push(element);
  }

  return optionCalls;
}

function getCommonDiscriminantKey(
  objectSchemaCalls: TSESTree.CallExpression[],
  imports: ValibotImports,
): string | null {
  const literalKeyMaps = objectSchemaCalls.map((schemaCall) =>
    getLiteralDiscriminantKeyMap(schemaCall, imports),
  );

  if (literalKeyMaps.some((map) => map.size === 0)) {
    return null;
  }

  const firstMap = literalKeyMaps[0];

  for (const [keyName, firstLiteral] of firstMap) {
    let isCommon = true;
    const literalValues = new Set<string>([firstLiteral]);

    for (let index = 1; index < literalKeyMaps.length; index += 1) {
      const literalValue = literalKeyMaps[index].get(keyName);

      if (!literalValue) {
        isCommon = false;
        break;
      }

      literalValues.add(literalValue);
    }

    if (isCommon && literalValues.size > 1) {
      return keyName;
    }
  }

  return null;
}

function getLiteralDiscriminantKeyMap(
  objectSchemaCall: TSESTree.CallExpression,
  imports: ValibotImports,
): Map<string, string> {
  const entriesArg = objectSchemaCall.arguments[0];

  if (!entriesArg || entriesArg.type !== 'ObjectExpression') {
    return new Map();
  }

  const keyMap = new Map<string, string>();

  for (const property of entriesArg.properties) {
    if (property.type !== 'Property' || property.computed) {
      continue;
    }

    const keyName = getPropertyKeyName(property.key);

    if (!keyName) {
      continue;
    }

    const literalValue = getLiteralSchemaValue(property.value, imports);

    if (!literalValue) {
      continue;
    }

    keyMap.set(keyName, literalValue);
  }

  return keyMap;
}

function getPropertyKeyName(key: TSESTree.Property['key']): string | null {
  if (key.type === 'Identifier') {
    return key.name;
  }

  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }

  return null;
}

function getLiteralSchemaValue(
  value: TSESTree.Node,
  imports: ValibotImports,
): string | null {
  if (value.type !== 'CallExpression') {
    return null;
  }

  if (
    !isValibotCall(value, imports, 'literal') ||
    value.arguments.length !== 1
  ) {
    return null;
  }

  const literalArg = value.arguments[0];

  if (!literalArg || literalArg.type !== 'Literal') {
    return null;
  }

  return String(literalArg.value);
}

function getPreferredCalleeText(
  call: TSESTree.CallExpression,
  imports: ValibotImports,
): string | null {
  if (call.callee.type === 'MemberExpression') {
    return `${sourceTextForMemberNamespace(call)}.variant`;
  }

  const localVariantName = getLocalImportName(imports, 'variant');

  return localVariantName ?? null;
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

function toSingleQuotedString(value: string): string {
  return `'${value.replaceAll("'", "\\'")}'`;
}
