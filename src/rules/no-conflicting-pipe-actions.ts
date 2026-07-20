import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getPipeActionDescriptors } from '../utils/pipe-analysis';
import { isValibotCall } from '../utils/is-valibot-call';

type Options = [];
type MessageIds = 'conflictingPipeActions';

interface LengthAction {
  actionIndex: number;
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
        imports = collectValibotImports(node);
      },
      CallExpression(node) {
        if (
          !hasValibotImports(imports) ||
          !isValibotCall(node, imports, 'pipe')
        ) {
          return;
        }

        const actions = getPipeActionDescriptors(node, imports, sourceCode);
        const lengthActions = actions.flatMap((action) => {
          if (action.name !== 'minLength' && action.name !== 'maxLength') {
            return [];
          }

          const limit = getNumericLiteralArgument(action.node);

          if (limit === null) {
            return [];
          }

          return [
            {
              actionIndex: action.actionIndex,
              limit,
              name: action.name,
              node: action.node,
            } satisfies LengthAction,
          ];
        });

        reportLengthConflicts(context.report.bind(context), lengthActions);
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

function reportLengthConflicts(
  report: (descriptor: {
    data: {
      firstAction: string;
      firstValue: string;
      secondAction: string;
      secondValue: string;
    };
    messageId: 'conflictingPipeActions';
    node: TSESTree.CallExpression;
  }) => void,
  lengthActions: LengthAction[],
): void {
  const minLengthActions = lengthActions.filter(
    (action) => action.name === 'minLength',
  );
  const maxLengthActions = lengthActions.filter(
    (action) => action.name === 'maxLength',
  );

  for (const minAction of minLengthActions) {
    for (const maxAction of maxLengthActions) {
      if (
        Math.abs(minAction.actionIndex - maxAction.actionIndex) === 1 &&
        minAction.limit > maxAction.limit
      ) {
        report({
          node: maxAction.node,
          messageId: 'conflictingPipeActions',
          data: {
            firstAction: minAction.name,
            firstValue: String(minAction.limit),
            secondAction: maxAction.name,
            secondValue: String(maxAction.limit),
          },
        });
      }
    }
  }
}
