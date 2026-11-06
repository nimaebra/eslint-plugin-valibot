import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import {
  getPipeActionDescriptors,
  VALUE_PRESERVING_ACTION_NAMES,
} from '../utils/pipe-analysis';
import { isValibotCallOrAsync } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'conflictingPipeActions';

interface LengthAction {
  limit: number;
  name: 'minLength' | 'maxLength';
  node: TSESTree.CallExpression;
}

export const noConflictingPipeActions = createRule<Options, MessageIds>({
  name: 'no-conflicting-pipe-actions',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow contradictory Valibot pipe actions in the same pipe() call.',
    },
    schema: [],
    messages: {
      conflictingPipeActions:
        '{{firstAction}}({{firstValue}}) conflicts with {{secondAction}}({{secondValue}}) in the same pipe().',
    },
  },
  defaultOptions: [],
  create(context) {
    let imports = createEmptyValibotImports();
    const sourceCode = context.sourceCode;

    return {
      Program(node) {
        imports = collectValibotImports(node, context.sourceCode);
      },
      CallExpression(node) {
        if (
          !hasValibotImports(imports) ||
          !isValibotCallOrAsync(node, imports, 'pipe')
        ) {
          return;
        }

        const actions = getPipeActionDescriptors(node, imports, sourceCode);
        const byIndex = new Map(
          actions.map((action) => [action.actionIndex, action]),
        );
        let min: LengthAction | undefined;
        let max: LengthAction | undefined;
        let reported = false;
        for (let index = 1; index < node.arguments.length; index++) {
          const action = byIndex.get(index);
          if (!action || !VALUE_PRESERVING_ACTION_NAMES.has(action.name)) {
            min = max = undefined;
            reported = false;
            continue;
          }
          if (action.name !== 'minLength' && action.name !== 'maxLength')
            continue;
          const limit = getNumericLiteralArgument(action.node);
          if (limit === null) continue;
          const bound: LengthAction = {
            name: action.name,
            limit,
            node: action.node,
          };
          if (action.name === 'minLength' && (!min || limit > min.limit))
            min = bound;
          if (action.name === 'maxLength' && (!max || limit < max.limit))
            max = bound;
          if (!reported && min && max && min.limit > max.limit) {
            context.report({
              node: max.node,
              messageId: 'conflictingPipeActions',
              data: {
                firstAction: min.name,
                firstValue: String(min.limit),
                secondAction: max.name,
                secondValue: String(max.limit),
              },
            });
            reported = true;
          }
        }
      },
    };
  },
});

function getNumericLiteralArgument(
  call: TSESTree.CallExpression,
): number | null {
  const argument = call.arguments[0];

  if (
    argument?.type === 'Literal' &&
    typeof argument.value === 'number' &&
    Number.isFinite(argument.value)
  ) {
    return argument.value;
  }

  return null;
}
