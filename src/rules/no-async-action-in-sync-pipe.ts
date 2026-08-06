import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getPipeActionDescriptors } from '../utils/pipe-analysis';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'asyncActionInSyncPipe';

const ASYNC_PIPE_ACTIONS = new Set([
  'argsAsync',
  'awaitAsync',
  'checkAsync',
  'checkItemsAsync',
  'rawCheckAsync',
  'rawTransformAsync',
  'returnsAsync',
  'transformAsync',
]);

export const noAsyncActionInSyncPipe = createRule<Options, MessageIds>({
  name: 'no-async-action-in-sync-pipe',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow async Valibot actions inside a synchronous pipe() call.',
    },
    schema: [],
    messages: {
      asyncActionInSyncPipe:
        '{{actionName}}() is asynchronous and will not run correctly inside pipe(). Use pipeAsync() instead.',
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

        for (const action of getPipeActionDescriptors(
          node,
          imports,
          sourceCode,
        )) {
          if (!ASYNC_PIPE_ACTIONS.has(action.name)) {
            continue;
          }

          context.report({
            node: action.node,
            messageId: 'asyncActionInSyncPipe',
            data: {
              actionName: action.name,
            },
          });
        }
      },
    };
  },
});
