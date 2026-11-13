import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import {
  getValibotCallName,
  getValibotCallVariant,
} from '../utils/is-valibot-call';
import { resolveLocalInitializer } from '../utils/local-initializer';

const reshapeMethods = new Set([
  'pick',
  'omit',
  'partial',
  'partialAsync',
  'required',
  'requiredAsync',
]);
const objectConstructors = new Set([
  'object',
  'looseObject',
  'strictObject',
  'objectWithRest',
]);

export const noObjectReshapeAfterPipe = createRule<[], 'reshapeBeforePipe'>({
  name: 'no-object-reshape-after-pipe',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow reshaping a Valibot object schema after it has been piped.',
    },
    schema: [],
    messages: {
      reshapeBeforePipe:
        '{{reshape}}() can change the declared entries while {{pipe}}() still validates the original object. Reshape the base object before adding compatible pipe actions.',
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
        const reshape = getValibotCallName(node, imports);
        if (!reshape || !reshapeMethods.has(reshape)) return;

        const [schema] = node.arguments;
        if (!schema) return;
        let current = resolveLocalInitializer(schema, sourceCode);
        if (current?.type !== 'CallExpression') return;
        const pipe = getValibotCallName(current, imports);
        if (pipe !== 'pipe' && pipe !== 'pipeAsync') return;

        const visited = new Set<TSESTree.CallExpression>();
        while (current?.type === 'CallExpression' && !visited.has(current)) {
          visited.add(current);
          const call = getValibotCallVariant(current, imports);
          if (call?.name === 'pipe') {
            current = resolveLocalInitializer(current.arguments[0], sourceCode);
            continue;
          }
          if (call && objectConstructors.has(call.name)) {
            context.report({
              node: schema,
              messageId: 'reshapeBeforePipe',
              data: { reshape, pipe },
            });
          }
          return;
        }
      },
    };
  },
});
