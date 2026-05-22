import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'emptyPipe' | 'redundantPipe';

export const noEmptyPipe = createRule<Options, MessageIds>({
  name: 'no-empty-pipe',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow empty pipe() calls or pipe() calls with a single argument.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      emptyPipe: 'Avoid calling pipe() with no arguments.',
      redundantPipe: 'Avoid calling pipe() with only a single schema. Remove the pipe() wrapper.',
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

        if (!isValibotCall(node, imports, 'pipe')) {
          return;
        }

        if (node.arguments.length === 0) {
          context.report({
            node,
            messageId: 'emptyPipe',
          });
          return;
        }

        if (node.arguments.length === 1) {
          const singleArg = node.arguments[0];
          context.report({
            node,
            messageId: 'redundantPipe',
            fix(fixer) {
              return fixer.replaceText(node, sourceCode.getText(singleArg));
            },
          });
        }
      },
    };
  },
});
