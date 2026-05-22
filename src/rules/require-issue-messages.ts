import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getIssueMessageParameterIndex } from '../utils/issue-message-signatures';
import { getValibotCallName, isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'missingIssueMessage';

export const requireIssueMessages = createRule<Options, MessageIds>({
  name: 'require-issue-messages',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require explicit custom issue messages on Valibot schemas and issue-producing actions.',
    },
    schema: [],
    messages: {
      missingIssueMessage:
        "Provide a custom issue message for '{{name}}()' using its message argument or a direct message() wrapper.",
    },
  },
  defaultOptions: [],
  create(context) {
    let imports = createEmptyValibotImports();

    return {
      Program(node) {
        imports = collectValibotImports(node);
      },
      CallExpression(node) {
        if (!hasValibotImports(imports)) {
          return;
        }

        const callName = getValibotCallName(node, imports);

        if (!callName) {
          return;
        }

        const messageParameterIndex = getIssueMessageParameterIndex(callName);

        if (messageParameterIndex === null) {
          return;
        }

        if (
          hasInlineIssueMessage(node, messageParameterIndex) ||
          isWrappedByDirectMessageCall(node, imports)
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'missingIssueMessage',
          data: {
            name: callName,
          },
        });
      },
    };
  },
});

function hasInlineIssueMessage(
  node: TSESTree.CallExpression,
  messageParameterIndex: number,
): boolean {
  const messageArgument = node.arguments[messageParameterIndex];

  return (
    Boolean(messageArgument) && !isMissingMessageExpression(messageArgument)
  );
}

function isWrappedByDirectMessageCall(
  node: TSESTree.CallExpression,
  imports: Parameters<typeof isValibotCall>[1],
): boolean {
  const parent = node.parent;

  return (
    parent?.type === 'CallExpression' &&
    parent.arguments[0] === node &&
    isValibotCall(parent, imports, 'message') &&
    Boolean(parent.arguments[1]) &&
    !isMissingMessageExpression(parent.arguments[1])
  );
}

function isMissingMessageExpression(
  node: TSESTree.CallExpressionArgument,
): boolean {
  return (
    (node.type === 'Identifier' && node.name === 'undefined') ||
    (node.type === 'Literal' &&
      (node.value === null || node.value === undefined)) ||
    (node.type === 'UnaryExpression' && node.operator === 'void')
  );
}
