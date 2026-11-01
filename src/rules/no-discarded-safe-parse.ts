import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallName } from '../utils/is-valibot-call';

export const noDiscardedSafeParse = createRule<[], 'discardedResult'>({
  name: 'no-discarded-safe-parse',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow discarding the result of safeParse() or awaited safeParseAsync().',
    },
    schema: [],
    messages: {
      discardedResult:
        '{{name}}() returns validation success and issues instead of throwing. Handle its result so validation failures are not lost.',
    },
  },
  defaultOptions: [],
  create(context) {
    let imports = createEmptyValibotImports();
    return {
      Program(node) {
        imports = collectValibotImports(node, context.sourceCode);
      },
      CallExpression(node) {
        if (!hasValibotImports(imports)) return;
        const name = getValibotCallName(node, imports);
        if (name !== 'safeParse' && name !== 'safeParseAsync') return;
        const result =
          node.parent.type === 'AwaitExpression' ? node.parent : node;
        // Floating async calls belong to no-unawaited-parse-async.
        if (name === 'safeParseAsync' && result === node) return;
        if (result.parent.type === 'ExpressionStatement') {
          context.report({
            node: result,
            messageId: 'discardedResult',
            data: { name },
          });
        }
      },
    };
  },
});
