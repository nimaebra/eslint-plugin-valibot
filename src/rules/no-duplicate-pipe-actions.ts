import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getPipeActionDescriptors } from '../utils/pipe-analysis';
import { isValibotCallOrAsync } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'duplicatePipeAction';

// Only deduplicate actions whose built-in behavior is idempotent. Callbacks,
// regular expressions and arbitrary transformations can depend on state.
const IDEMPOTENT_ACTION_NAMES = new Set([
  'trim',
  'trimStart',
  'trimEnd',
  'toLowerCase',
  'toUpperCase',
  'normalize',
  'length',
  'minLength',
  'maxLength',
  'nonEmpty',
  'size',
  'minSize',
  'maxSize',
  'value',
  'minValue',
  'maxValue',
  'multipleOf',
  'integer',
  'safeInteger',
  'finite',
]);

export const noDuplicatePipeActions = createRule<Options, MessageIds>({
  name: 'no-duplicate-pipe-actions',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow consecutive duplicate idempotent Valibot actions inside pipe() calls.',
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
          !isValibotCallOrAsync(node, imports, 'pipe')
        ) {
          return;
        }

        for (const action of getPipeActionDescriptors(
          node,
          imports,
          sourceCode,
        )) {
          const previousAction = node.arguments[action.actionIndex - 1];

          if (
            action.actionIndex < 2 ||
            !IDEMPOTENT_ACTION_NAMES.has(action.name) ||
            !action.node.arguments.every(
              (argument) =>
                argument.type === 'Literal' && !('regex' in argument),
            ) ||
            sourceCode.getText(previousAction) !== action.fingerprint
          ) {
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
    getCommentsInside(node: TSESTree.Node): unknown[];
  }>,
): boolean {
  const currentAction = pipeCall.arguments[actionIndex];

  if (!currentAction) {
    return false;
  }

  if (
    sourceCode.getCommentsBefore(currentAction).length > 0 ||
    sourceCode.getCommentsAfter(currentAction).length > 0 ||
    sourceCode.getCommentsInside(currentAction).length > 0
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
