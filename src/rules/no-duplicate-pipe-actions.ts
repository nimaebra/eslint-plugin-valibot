import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getPipeActionDescriptors } from '../utils/pipe-analysis';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'duplicatePipeAction';

export const noDuplicatePipeActions = createRule<Options, MessageIds>({
  name: 'no-duplicate-pipe-actions',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow duplicate Valibot actions inside the same pipe() call.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      duplicatePipeAction:
        'This pipe action duplicates an earlier {{actionName}}() call in the same pipe.',
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
          !isValibotCall(node, imports, 'pipe')
        ) {
          return;
        }

        const seenActions = new Map<string, TSESTree.CallExpression>();

        for (const action of getPipeActionDescriptors(
          node,
          imports,
          sourceCode,
        )) {
          const firstAction = seenActions.get(action.fingerprint);

          if (!firstAction) {
            seenActions.set(action.fingerprint, action.node);
            continue;
          }

          context.report({
            node: action.node,
            messageId: 'duplicatePipeAction',
            data: {
              actionName: action.name,
            },
            fix: canSafelyRemoveDuplicateAction(
              node,
              action.actionIndex,
              sourceCode,
            )
              ? (fixer) => {
                  const removalRange = getDuplicateActionRemovalRange(
                    node,
                    action.actionIndex,
                  );

                  return fixer.removeRange(removalRange);
                }
              : null,
          });
        }
      },
    };
  },
});

function canSafelyRemoveDuplicateAction(
  pipeCall: TSESTree.CallExpression,
  actionIndex: number,
  sourceCode: Readonly<{
    getCommentsBefore(node: TSESTree.Node): unknown[];
    getCommentsAfter(node: TSESTree.Node): unknown[];
  }>,
): boolean {
  const currentAction = pipeCall.arguments[actionIndex];

  if (!currentAction) {
    return false;
  }

  if (
    sourceCode.getCommentsBefore(currentAction).length > 0 ||
    sourceCode.getCommentsAfter(currentAction).length > 0
  ) {
    return false;
  }

  return true;
}

function getDuplicateActionRemovalRange(
  pipeCall: TSESTree.CallExpression,
  actionIndex: number,
): TSESTree.Range {
  const currentAction = pipeCall.arguments[actionIndex];

  if (!currentAction) {
    return [pipeCall.range[0], pipeCall.range[0]];
  }

  const nextAction = pipeCall.arguments[actionIndex + 1];

  if (nextAction) {
    return [currentAction.range[0], nextAction.range[0]];
  }

  const previousAction = pipeCall.arguments[actionIndex - 1];

  if (!previousAction) {
    return currentAction.range;
  }

  return [previousAction.range[1], currentAction.range[1]];
}
