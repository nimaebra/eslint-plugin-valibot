import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'avoidUnknownSchema';

export const noUnknownSchema = createRule<Options, MessageIds>({
  name: 'no-unknown-schema',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Valibot unknown() schemas.',
    },
    schema: [],
    messages: {
      avoidUnknownSchema:
        'Avoid Valibot unknown() schemas. Prefer a more precise schema.',
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

        if (!isValibotCall(node, imports, 'unknown')) {
          return;
        }

        context.report({
          node,
          messageId: 'avoidUnknownSchema',
        });
      },
    };
  },
});
