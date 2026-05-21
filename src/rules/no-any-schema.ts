import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'avoidAnySchema';

export const noAnySchema = createRule<Options, MessageIds>({
  name: 'no-any-schema',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Valibot any() schemas.',
    },
    schema: [],
    messages: {
      avoidAnySchema:
        'Avoid Valibot any() schemas. Prefer unknown() or a more precise schema.',
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

        if (!isValibotCall(node, imports, 'any')) {
          return;
        }

        context.report({
          node,
          messageId: 'avoidAnySchema',
        });
      },
    };
  },
});
