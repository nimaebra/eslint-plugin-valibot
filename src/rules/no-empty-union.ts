import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'emptyUnion';

export const noEmptyUnion = createRule<Options, MessageIds>({
  name: 'no-empty-union',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Valibot union() calls without schema options.',
    },
    schema: [],
    messages: {
      emptyUnion:
        'Avoid calling union() without schema options. Provide at least one schema option.',
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
        if (
          !hasValibotImports(imports) ||
          !isValibotCall(node, imports, 'union')
        ) {
          return;
        }

        const options = node.arguments[0];

        if (
          options &&
          (options.type !== 'ArrayExpression' ||
            options.elements.some((element) => element !== null))
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'emptyUnion',
        });
      },
    };
  },
});
