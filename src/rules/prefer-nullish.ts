import type { TSESTree } from '@typescript-eslint/utils';

import { getValibotCalleeText } from '../utils/callee-text';
import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import {
  getValibotCallVariant,
  toAsyncApiName,
} from '../utils/is-valibot-call';

const WRAPPER_PAIRS = [
  ['optional', 'nullable'],
  ['nullable', 'optional'],
] as const;

type Options = [];
type MessageIds = 'preferNullish';

export const preferNullish = createRule<Options, MessageIds>({
  name: 'prefer-nullish',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer nullish() over nested optional() and nullable() wrappers.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferNullish:
        'Prefer nullish() instead of nesting optional() and nullable().',
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
        if (!hasValibotImports(imports) || node.arguments.length !== 1) {
          return;
        }

        const innerCall = node.arguments[0];

        if (
          innerCall?.type !== 'CallExpression' ||
          innerCall.arguments.length !== 1
        ) {
          return;
        }

        const innerSchema = innerCall.arguments[0];

        if (!innerSchema) {
          return;
        }

        const isAsync = getWrapperPairAsyncness(node, innerCall, imports);

        if (isAsync === null) {
          return;
        }

        const preferredCalleeText = getValibotCalleeText(
          node,
          imports,
          toAsyncApiName('nullish', isAsync),
        );

        context.report({
          node,
          messageId: 'preferNullish',
          fix: preferredCalleeText
            ? (fixer) =>
                fixer.replaceText(
                  node,
                  `${preferredCalleeText}(${sourceCode.getText(innerSchema)})`,
                )
            : null,
        });
      },
    };
  },
});

/**
 * Returns whether a matching optional/nullable wrapper pair is async, or
 * `null` when the calls are not such a pair. Mixed sync/async pairs are left
 * alone because they are already a type error.
 */
function getWrapperPairAsyncness(
  outerCall: TSESTree.CallExpression,
  innerCall: TSESTree.CallExpression,
  imports: ValibotImports,
): boolean | null {
  const outer = getValibotCallVariant(outerCall, imports);
  const inner = getValibotCallVariant(innerCall, imports);

  if (!outer || !inner || outer.isAsync !== inner.isAsync) {
    return null;
  }

  const isPair = WRAPPER_PAIRS.some(
    ([outerName, innerName]) =>
      outer.name === outerName && inner.name === innerName,
  );

  return isPair ? outer.isAsync : null;
}
