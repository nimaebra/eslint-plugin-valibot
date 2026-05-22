import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'noLazyNonFunction';

export const noLazyNonFunction = createRule<Options, MessageIds>({
  name: 'no-lazy-non-function',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow passing a direct schema or non-function value to lazy().',
    },
    schema: [],
    messages: {
      noLazyNonFunction:
        'lazy() requires a function returning a schema (e.g. () => Schema). Passing a direct value or schema is incorrect and causes runtime errors.',
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

        if (!isValibotCall(node, imports, 'lazy')) {
          return;
        }

        const arg = node.arguments[0];

        if (!arg) {
          context.report({
            node,
            messageId: 'noLazyNonFunction',
          });
          return;
        }

        if (
          arg.type !== 'ArrowFunctionExpression' &&
          arg.type !== 'FunctionExpression' &&
          arg.type !== 'Identifier' &&
          arg.type !== 'MemberExpression'
        ) {
          context.report({
            node,
            messageId: 'noLazyNonFunction',
          });
        }
      },
    };
  },
});
