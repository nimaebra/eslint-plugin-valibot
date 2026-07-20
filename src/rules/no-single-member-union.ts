import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'singleMemberUnion';

export const noSingleMemberUnion = createRule<Options, MessageIds>({
  name: 'no-single-member-union',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Valibot union() calls with only one schema option.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      singleMemberUnion:
        'Avoid calling union() with a single schema. Use the inner schema directly.',
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

        const singleMember = getSingleUnionMember(node);

        if (!singleMember) {
          return;
        }

        context.report({
          node,
          messageId: 'singleMemberUnion',
          fix:
            node.arguments.length === 1 &&
            isSafeReplacementExpression(singleMember)
              ? (fixer) =>
                  fixer.replaceText(node, sourceCode.getText(singleMember))
              : null,
        });
      },
    };
  },
});

function getSingleUnionMember(
  call: TSESTree.CallExpression,
): TSESTree.Expression | null {
  if (call.arguments.length === 0) {
    return null;
  }

  const options = call.arguments[0];

  if (options?.type !== 'ArrayExpression' || options.elements.length !== 1) {
    return null;
  }

  const member = options.elements[0];

  if (!member || member.type === 'SpreadElement') {
    return null;
  }

  return member;
}

function isSafeReplacementExpression(expression: TSESTree.Expression): boolean {
  return (
    expression.type === 'Identifier' ||
    expression.type === 'CallExpression' ||
    expression.type === 'MemberExpression'
  );
}
