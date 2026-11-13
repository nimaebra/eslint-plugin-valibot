import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import {
  getValibotCallName,
  isValibotCallOrAsync,
} from '../utils/is-valibot-call';
import { resolveLocalInitializer } from '../utils/local-initializer';
import { VALUE_PRESERVING_ACTION_NAMES } from '../utils/pipe-analysis';
import { getReferencedVariable } from '../utils/referenced-variable';

const stringPreservingActions = new Set([
  ...VALUE_PRESERVING_ACTION_NAMES,
  'description',
  'maxSize',
  'maxValue',
  'metadata',
  'minSize',
  'minValue',
  'normalize',
  'size',
  'title',
  'toLowerCase',
  'toUpperCase',
  'trim',
  'trimEnd',
  'trimStart',
]);

export const noTruthyStringCoercion = createRule<[], 'truthyString'>({
  name: 'no-truthy-string-coercion',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow coercing Valibot string inputs to booleans using JavaScript truthiness.',
    },
    schema: [],
    messages: {
      truthyString:
        'Boolean coercion turns every non-empty string, including "false", into true. Parse the accepted string values explicitly.',
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
        if (
          !hasValibotImports(imports) ||
          !isValibotCallOrAsync(node, imports, 'pipe')
        )
          return;
        if (!hasStringOutput(node.arguments[0])) return;

        for (let index = 1; index < node.arguments.length; index++) {
          const argument = node.arguments[index];
          const action = resolveLocalInitializer(argument, sourceCode);
          if (action?.type !== 'CallExpression' || action.optional) return;
          const name = getValibotCallName(action, imports);
          if (!name) return;
          if (stringPreservingActions.has(name)) continue;

          const [callback] = action.arguments;
          if (
            name === 'toBoolean' ||
            (name === 'transform' &&
              callback?.type === 'Identifier' &&
              callback.name === 'Boolean' &&
              isBuiltinBoolean(callback))
          ) {
            context.report({ node: argument, messageId: 'truthyString' });
          }
          // After a transformation or unknown action, the value may no longer be a string.
          return;
        }
      },
    };

    function hasStringOutput(node: TSESTree.Node | undefined): boolean {
      const visited = new Set<TSESTree.CallExpression>();
      let schema = resolveLocalInitializer(node, sourceCode);
      while (
        schema?.type === 'CallExpression' &&
        !schema.optional &&
        !visited.has(schema)
      ) {
        const name = getValibotCallName(schema, imports);
        if (name === 'string') return true;
        if (name !== 'pipe' && name !== 'pipeAsync') return false;
        visited.add(schema);

        const [base, ...actions] = schema.arguments;
        if (
          !actions.every((argument) => {
            const action = resolveLocalInitializer(argument, sourceCode);
            if (action?.type !== 'CallExpression' || action.optional)
              return false;
            const actionName = getValibotCallName(action, imports);
            return (
              actionName !== null && stringPreservingActions.has(actionName)
            );
          })
        )
          return false;
        schema = resolveLocalInitializer(base, sourceCode);
      }
      return false;
    }

    function isBuiltinBoolean(identifier: TSESTree.Identifier): boolean {
      const variable = getReferencedVariable(sourceCode, identifier);
      return (
        !variable ||
        (variable.defs.length === 0 &&
          !variable.references.some((ref) => ref.isWrite()))
      );
    }
  },
});
