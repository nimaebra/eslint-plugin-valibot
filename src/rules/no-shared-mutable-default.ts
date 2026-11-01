import { ASTUtils } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallVariant } from '../utils/is-valibot-call';

const DEFAULT_WRAPPERS = new Set([
  'optional',
  'nullable',
  'nullish',
  'undefinedable',
  'exactOptional',
]);
const IDENTITY_SCHEMAS = new Set(['any', 'unknown', 'date']);

export const noSharedMutableDefault = createRule<
  [],
  'sharedDefault' | 'useFactory'
>({
  name: 'no-shared-mutable-default',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow mutable default values that are shared across Valibot parses.',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      sharedDefault:
        '{{name}}() reuses this mutable value across parses. Use a factory to create a fresh value for each parse.',
      useFactory: 'Create a fresh default value with a factory.',
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
        const wrapper = getValibotCallVariant(node, imports);
        if (!wrapper || !DEFAULT_WRAPPERS.has(wrapper.name)) return;
        const [schema, value] = node.arguments;
        if (schema?.type !== 'CallExpression' || !value) return;
        const wrapped = getValibotCallVariant(schema, imports);
        if (!wrapped || !IDENTITY_SCHEMAS.has(wrapped.name)) return;
        const isDate =
          value.type === 'NewExpression' &&
          value.callee.type === 'Identifier' &&
          value.callee.name === 'Date' &&
          !ASTUtils.findVariable(context.sourceCode.getScope(value), 'Date')
            ?.defs.length;
        const isContainer =
          value.type === 'ObjectExpression' || value.type === 'ArrayExpression';
        if ((!isDate && !isContainer) || (wrapped.name === 'date' && !isDate))
          return;
        context.report({
          node: value,
          messageId: 'sharedDefault',
          data: { name: `${wrapper.name}${wrapper.isAsync ? 'Async' : ''}` },
          suggest: [
            {
              messageId: 'useFactory',
              fix: (fixer) =>
                fixer.replaceText(
                  value,
                  `() => (${context.sourceCode.getText(value)})`,
                ),
            },
          ],
        });
      },
    };
  },
});
