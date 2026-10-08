import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallVariant } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'nestedPipe';

export const preferFlattenPipe = createRule<Options, MessageIds>({
  name: 'prefer-flatten-pipe',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer a single flattened pipe() call over nested pipe() calls.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      nestedPipe:
        'Flatten nested pipe() calls into a single pipe() with all schema and action arguments.',
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
        if (!hasValibotImports(imports)) {
          return;
        }

        const variant = getValibotCallVariant(node, imports);

        if (variant?.name !== 'pipe') {
          return;
        }

        const nestedPipe = getNestedPipeArgument(
          node,
          imports,
          variant.isAsync,
        );

        if (!nestedPipe) {
          return;
        }

        const flattenedArguments = flattenPipeArguments(
          node,
          imports,
          variant.isAsync,
        );

        if (
          !flattenedArguments ||
          hasCommentInRange(sourceCode.getAllComments(), node.range)
        ) {
          context.report({
            node,
            messageId: 'nestedPipe',
          });
          return;
        }

        const argumentTexts = flattenedArguments.map((argument) =>
          sourceCode.getText(argument),
        );

        context.report({
          node,
          messageId: 'nestedPipe',
          fix: (fixer) =>
            fixer.replaceText(
              node,
              `${sourceCode.getText(node.callee)}(${argumentTexts.join(', ')})`,
            ),
        });
      },
    };
  },
});

function getNestedPipeArgument(
  pipeCall: TSESTree.CallExpression,
  imports: ValibotImports,
  isOuterAsync: boolean,
): TSESTree.CallExpression | null {
  const firstArgument = pipeCall.arguments[0];

  if (isFlattenablePipe(firstArgument, imports, isOuterAsync)) {
    return firstArgument;
  }

  return null;
}

function flattenPipeArguments(
  pipeCall: TSESTree.CallExpression,
  imports: ValibotImports,
  isOuterAsync: boolean,
): TSESTree.Expression[] | null {
  const flattened: TSESTree.Expression[] = [];

  for (const argument of pipeCall.arguments) {
    if (argument.type === 'SpreadElement') {
      return null;
    }

    if (isFlattenablePipe(argument, imports, isOuterAsync)) {
      const nestedArguments = flattenPipeArguments(
        argument,
        imports,
        isOuterAsync,
      );

      if (!nestedArguments) {
        return null;
      }

      flattened.push(...nestedArguments);
      continue;
    }

    flattened.push(argument);
  }

  return flattened.length >= 2 ? flattened : null;
}

function hasCommentInRange(
  comments: TSESTree.Comment[],
  range: TSESTree.Range,
): boolean {
  return comments.some(
    (comment) => comment.range[0] < range[1] && comment.range[1] > range[0],
  );
}

/**
 * A sync pipe can only absorb sync pipes, while `pipeAsync()` can absorb both
 * because sync actions are valid inside an async pipe.
 */
function isFlattenablePipe(
  node: TSESTree.Node | undefined,
  imports: ValibotImports,
  isOuterAsync: boolean,
): node is TSESTree.CallExpression {
  if (node?.type !== 'CallExpression') {
    return false;
  }

  const variant = getValibotCallVariant(node, imports);

  return variant?.name === 'pipe' && (isOuterAsync || !variant.isAsync);
}
