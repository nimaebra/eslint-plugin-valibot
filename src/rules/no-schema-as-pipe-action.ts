import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallName, isValibotCall } from '../utils/is-valibot-call';
import { isValibotSchemaExpression } from '../utils/is-schema-expression';

type Options = [];
type MessageIds = 'noSchemaAsPipeAction' | 'actionAsFirstArgument';

export const noSchemaAsPipeAction = createRule<Options, MessageIds>({
  name: 'no-schema-as-pipe-action',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure the first argument of pipe() is a schema and subsequent arguments are actions.',
    },
    schema: [],
    messages: {
      noSchemaAsPipeAction:
        "Avoid passing the schema '{{name}}()' as a pipe action. All subsequent arguments to pipe() must be validation or transformation actions (e.g., email(), trim()).",
      actionAsFirstArgument:
        "Avoid passing the validation/transformation action '{{name}}()' as the first argument to pipe(). The first argument must be a base schema (e.g., string()).",
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

        if (!isValibotCall(node, imports, 'pipe')) {
          return;
        }

        // Validate the first argument (must be a schema, not a validation action)
        const firstArg = node.arguments[0];
        if (firstArg && firstArg.type === 'CallExpression') {
          const callName = getValibotCallName(firstArg, imports);
          if (callName && !isValibotSchemaExpression(firstArg, imports)) {
            context.report({
              node: firstArg,
              messageId: 'actionAsFirstArgument',
              data: {
                name: callName,
              },
            });
          }
        }

        // Validate subsequent arguments (must not be schemas)
        node.arguments.forEach((argument, index) => {
          if (index === 0) {
            return;
          }

          if (isValibotSchemaExpression(argument, imports)) {
            context.report({
              node: argument,
              messageId: 'noSchemaAsPipeAction',
              data: {
                name: getValibotCallName(argument, imports) ?? 'schema',
              },
            });
          }
        });
      },
    };
  },
});
