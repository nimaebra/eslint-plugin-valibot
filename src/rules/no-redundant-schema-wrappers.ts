import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallVariant } from '../utils/is-valibot-call';

const DUPLICATE_WRAPPER_NAMES = new Set([
  'optional',
  'nullable',
  'nullish',
  'nonOptional',
  'nonNullable',
  'nonNullish',
]);

type Options = [];
type MessageIds = 'redundantWrapper';

export const noRedundantSchemaWrappers = createRule<Options, MessageIds>({
  name: 'no-redundant-schema-wrappers',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow redundant nested Valibot schema wrappers.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      redundantWrapper:
        'This Valibot wrapper is applied redundantly. Remove the outer wrapper.',
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

        if (node.arguments.length !== 1) {
          return;
        }

        const innerCall = node.arguments[0];

        if (
          innerCall.type !== 'CallExpression' ||
          innerCall.arguments.length !== 1
        ) {
          return;
        }

        const duplicatedWrapperName = getDuplicatedWrapperName(
          node,
          innerCall,
          imports,
        );

        if (!duplicatedWrapperName) {
          return;
        }

        context.report({
          node,
          messageId: 'redundantWrapper',
          fix(fixer) {
            return fixer.replaceText(node, sourceCode.getText(innerCall));
          },
        });
      },
    };
  },
});

function getDuplicatedWrapperName(
  outerCall: TSESTree.CallExpression,
  innerCall: TSESTree.CallExpression,
  imports: ValibotImports,
): string | null {
  const outer = getValibotCallVariant(outerCall, imports);
  const inner = getValibotCallVariant(innerCall, imports);

  if (
    !outer ||
    !inner ||
    !DUPLICATE_WRAPPER_NAMES.has(outer.name) ||
    outer.name !== inner.name ||
    outer.isAsync !== inner.isAsync
  ) {
    return null;
  }

  return outer.name;
}
