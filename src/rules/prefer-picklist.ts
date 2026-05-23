import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'preferPicklist';

export const preferPicklist = createRule<Options, MessageIds>({
  name: 'prefer-picklist',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer picklist() over union() when the union only contains literal string schemas.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferPicklist:
        'Prefer picklist([...]) instead of union([...]) for literal string options.',
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

        const optionsArg = node.arguments[0];

        if (optionsArg?.type !== 'ArrayExpression') {
          return;
        }

        const literalOptionTexts = getLiteralOptionTexts(
          optionsArg,
          imports,
          sourceCode,
        );

        if (!literalOptionTexts) {
          return;
        }

        const preferredCalleeText = getPreferredCalleeText(node, imports);

        context.report({
          node,
          messageId: 'preferPicklist',
          fix:
            preferredCalleeText &&
            (node.arguments.length === 1 || node.arguments.length === 2)
              ? (fixer) =>
                  fixer.replaceText(
                    node,
                    buildPicklistCallText(
                      node,
                      preferredCalleeText,
                      literalOptionTexts,
                      sourceCode,
                    ),
                  )
              : null,
        });
      },
    };
  },
});

function getLiteralOptionTexts(
  optionsArray: TSESTree.ArrayExpression,
  imports: ValibotImports,
  sourceCode: Readonly<TSESLintSourceCode>,
): string[] | null {
  if (optionsArray.elements.length < 2) {
    return null;
  }

  const literalTexts: string[] = [];

  for (const element of optionsArray.elements) {
    if (!element || element.type === 'SpreadElement') {
      return null;
    }

    if (element.type !== 'CallExpression') {
      return null;
    }

    if (
      !isValibotCall(element, imports, 'literal') ||
      element.arguments.length !== 1
    ) {
      return null;
    }

    const literalArg = element.arguments[0];

    if (
      !literalArg ||
      literalArg.type !== 'Literal' ||
      typeof literalArg.value !== 'string'
    ) {
      return null;
    }

    literalTexts.push(sourceCode.getText(literalArg));
  }

  return literalTexts;
}

function getPreferredCalleeText(
  call: TSESTree.CallExpression,
  imports: ValibotImports,
): string | null {
  if (call.callee.type === 'MemberExpression') {
    return `${sourceTextForMemberNamespace(call)}.picklist`;
  }

  const localPicklistName = getLocalImportName(imports, 'picklist');

  return localPicklistName ?? null;
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

function buildPicklistCallText(
  unionCall: TSESTree.CallExpression,
  calleeText: string,
  literalOptionTexts: string[],
  sourceCode: Readonly<TSESLintSourceCode>,
): string {
  const valuesText = `[${literalOptionTexts.join(', ')}]`;
  const messageArg = unionCall.arguments[1];

  if (messageArg) {
    return `${calleeText}(${valuesText}, ${sourceCode.getText(messageArg)})`;
  }

  return `${calleeText}(${valuesText})`;
}

interface TSESLintSourceCode {
  getText(node?: TSESTree.Node): string;
}
