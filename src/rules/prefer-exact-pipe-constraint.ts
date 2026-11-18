import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCallOrAsync } from '../utils/is-valibot-call';
import { getNumericLiteral } from '../utils/numeric-literal';
import { getPipeActionDescriptors } from '../utils/pipe-analysis';

const exactConstraints = [
  { min: 'minLength', max: 'maxLength', exact: 'length' },
  { min: 'minSize', max: 'maxSize', exact: 'size' },
];

export const preferExactPipeConstraint = createRule<[], 'preferExact'>({
  name: 'prefer-exact-pipe-constraint',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer an exact length or size action over adjacent equal bounds in a Valibot pipe.',
    },
    schema: [],
    messages: {
      preferExact:
        '{{min}}({{value}}) and {{max}}({{value}}) describe an exact constraint. Consider {{exact}}({{value}}).',
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
        const actions = getPipeActionDescriptors(node, imports, sourceCode);
        for (let index = 1; index < actions.length; index++) {
          const first = actions[index - 1];
          const second = actions[index];
          if (
            first.actionIndex + 1 !== second.actionIndex ||
            first.node.optional ||
            second.node.optional
          )
            continue;

          const constraint = exactConstraints.find(
            ({ min, max }) =>
              (first.name === min && second.name === max) ||
              (first.name === max && second.name === min),
          );
          if (!constraint) continue;
          const value = getNumericLiteral(first.node.arguments[0]);
          if (
            value === undefined ||
            !Number.isInteger(value) ||
            value < 0 ||
            value !== getNumericLiteral(second.node.arguments[0])
          )
            continue;

          context.report({
            node: second.node,
            messageId: 'preferExact',
            data: { ...constraint, value: String(value) },
          });
        }
      },
    };
  },
});
