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
import { getNumericLiteral } from '../utils/numeric-literal';

type Options = [];
type MessageIds = 'conflictingPipeActions';

type Domain = 'length' | 'size' | 'value';
type Bound = 'min' | 'max' | 'exact';

const constraints = new Map<string, [Domain, Bound]>([
  ['minLength', ['length', 'min']],
  ['maxLength', ['length', 'max']],
  ['length', ['length', 'exact']],
  ['minSize', ['size', 'min']],
  ['maxSize', ['size', 'max']],
  ['size', ['size', 'exact']],
  ['minValue', ['value', 'min']],
  ['maxValue', ['value', 'max']],
]);

interface ConstraintAction {
  limit: number;
  name: string;
  node: TSESTree.CallExpression;
}

interface Bounds {
  min?: ConstraintAction;
  max?: ConstraintAction;
  reported?: boolean;
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
        const boundsByDomain = new Map<Domain, Bounds>();
        for (let index = 1; index < node.arguments.length; index++) {
          const action = byIndex.get(index);
          const constraint = action && constraints.get(action.name);
          if (
            !action ||
            action.node.optional ||
            (!constraint && !VALUE_PRESERVING_ACTION_NAMES.has(action.name))
          ) {
            boundsByDomain.clear();
            continue;
          }
          if (!constraint) continue;
          const limit = getNumericLiteral(action.node.arguments[0]);
          if (limit === undefined) continue;

          const [domain, bound] = constraint;
          const bounds = boundsByDomain.get(domain) ?? {};
          boundsByDomain.set(domain, bounds);
          if (bounds.reported) continue;
          const current = { name: action.name, limit, node: action.node };
          if (bound !== 'max' && (!bounds.min || limit > bounds.min.limit))
            bounds.min = current;
          if (bound !== 'min' && (!bounds.max || limit < bounds.max.limit))
            bounds.max = current;
          const { min, max } = bounds;
          if (min && max && min.limit > max.limit) {
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
            bounds.reported = true;
          }
        }
      },
    };
  },
});
