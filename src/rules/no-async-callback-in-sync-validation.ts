import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallName } from '../utils/is-valibot-call';
import { resolveLocalInitializer } from '../utils/local-initializer';

const callbackPositions = new Map([
  ['check', 0],
  ['checkItems', 0],
  ['partialCheck', 1],
  ['custom', 0],
  ['rawCheck', 0],
  ['rawTransform', 0],
  ['transform', 0],
  ['everyItem', 0],
  ['someItem', 0],
  ['guard', 0],
]);
const withoutAsyncCounterpart = new Set(['everyItem', 'someItem', 'guard']);

export const noAsyncCallbackInSyncValidation = createRule<
  [],
  'useAsyncApi' | 'useSyncCallback'
>({
  name: 'no-async-callback-in-sync-validation',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow async callbacks in synchronous Valibot validation and transformation APIs.',
    },
    schema: [],
    messages: {
      useAsyncApi:
        '{{name}}() does not await its callback. Use {{name}}Async() with an async schema or use a synchronous callback.',
      useSyncCallback:
        '{{name}}() does not await its callback. Use a synchronous callback or move the async logic to an async validation action.',
    },
  },
  defaultOptions: [],
  create(context) {
    let imports = createEmptyValibotImports();
    const sourceCode = context.sourceCode;

    return {
      Program(node) {
        imports = collectValibotImports(node, sourceCode);
      },
      CallExpression(node) {
        if (!hasValibotImports(imports)) return;
        const name = getValibotCallName(node, imports);
        if (!name) return;
        const position = callbackPositions.get(name);
        if (position === undefined) return;
        const argument = node.arguments[position];
        if (
          !argument ||
          node.arguments
            .slice(0, position + 1)
            .some((arg) => arg.type === 'SpreadElement')
        )
          return;

        const callback = resolveLocalInitializer(argument, sourceCode);
        if (
          (callback?.type === 'ArrowFunctionExpression' ||
            callback?.type === 'FunctionExpression' ||
            callback?.type === 'FunctionDeclaration') &&
          callback.async
        ) {
          context.report({
            node: argument,
            messageId: withoutAsyncCounterpart.has(name)
              ? 'useSyncCallback'
              : 'useAsyncApi',
            data: { name },
          });
        }
      },
    };
  },
});
