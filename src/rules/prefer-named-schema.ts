import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotSchemaExpression } from '../utils/is-schema-expression';
import { isValibotCall } from '../utils/is-valibot-call';

const ENTRYPOINT_NAMES = [
  'assert',
  'is',
  'parse',
  'parser',
  'safeParse',
  'safeParser',
] as const;

type Options = [];
type MessageIds = 'preferNamedSchema';

export const preferNamedSchema = createRule<Options, MessageIds>({
  name: 'prefer-named-schema',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer passing a named schema variable into Valibot parse-like APIs instead of an inline schema expression.',
    },
    schema: [],
    messages: {
      preferNamedSchema:
        'Extract this inline schema into a named variable before passing it to {{functionName}}().',
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
        if (!hasValibotImports(imports) || node.arguments.length === 0) {
          return;
        }

        const entrypointName = getEntrypointName(node, imports);
        const schemaArgument = node.arguments[0];

        if (
          !entrypointName ||
          !isValibotSchemaExpression(schemaArgument, imports)
        ) {
          return;
        }

        context.report({
          node: schemaArgument,
          messageId: 'preferNamedSchema',
          data: {
            functionName: entrypointName,
          },
        });
      },
    };
  },
});

function getEntrypointName(
  node: Parameters<typeof isValibotCall>[0],
  imports: ValibotImports,
): (typeof ENTRYPOINT_NAMES)[number] | null {
  for (const entrypointName of ENTRYPOINT_NAMES) {
    if (isValibotCall(node, imports, entrypointName)) {
      return entrypointName;
    }
  }

  return null;
}
