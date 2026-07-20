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
        if (
          !hasValibotImports(imports) ||
          !isValibotCall(node, imports, 'pipe')
        ) {
          return;
        }

        const nestedPipe = getNestedPipeArgument(node, imports);

        if (!nestedPipe) {
          return;
        }

        const flattenedArguments = flattenPipeArguments(node, imports);

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
): TSESTree.CallExpression | null {
  const firstArgument = pipeCall.arguments[0];

  if (
    firstArgument?.type === 'CallExpression' &&
    isValibotCall(firstArgument, imports, 'pipe')
  ) {
    return firstArgument;
  }

  return null;
}

function flattenPipeArguments(
  pipeCall: TSESTree.CallExpression,
  imports: ValibotImports,
): TSESTree.Expression[] | null {
  const flattened: TSESTree.Expression[] = [];

  for (const argument of pipeCall.arguments) {
    if (argument.type === 'SpreadElement') {
      return null;
    }

    if (
      argument.type === 'CallExpression' &&
      isValibotCall(argument, imports, 'pipe')
    ) {
      const nestedArguments = flattenPipeArguments(argument, imports);

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
