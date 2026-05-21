import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

const DUPLICATE_WRAPPER_NAMES = new Set([
  'optional',
  'nullable',
  'nullish',
  'nonOptional',
  'nonNullable',
  'nonNullish',
]);

type Options = [];
type MessageIds = 'redundantWrapper';

export const noRedundantSchemaWrappers = createRule<Options, MessageIds>({
  name: 'no-redundant-schema-wrappers',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow redundant nested Valibot schema wrappers.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      redundantWrapper:
        'This Valibot wrapper is applied redundantly. Remove the outer wrapper.',
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

        if (node.arguments.length !== 1) {
          return;
        }

        const innerCall = node.arguments[0];

        if (
          innerCall.type !== 'CallExpression' ||
          innerCall.arguments.length !== 1
        ) {
          return;
        }

        const duplicatedWrapperName = getDuplicatedWrapperName(
          node,
          innerCall,
          imports,
        );

        if (!duplicatedWrapperName) {
          return;
        }

        context.report({
          node,
          messageId: 'redundantWrapper',
          fix(fixer) {
            return fixer.replaceText(node, sourceCode.getText(innerCall));
          },
        });
      },
    };
  },
});

function getDuplicatedWrapperName(
  outerCall: Parameters<typeof isValibotCall>[0],
  innerCall: Parameters<typeof isValibotCall>[0],
  imports: Parameters<typeof isValibotCall>[1],
): string | null {
  for (const wrapperName of DUPLICATE_WRAPPER_NAMES) {
    if (
      isValibotCall(outerCall, imports, wrapperName) &&
      isValibotCall(innerCall, imports, wrapperName)
    ) {
      return wrapperName;
    }
  }

  return null;
}
