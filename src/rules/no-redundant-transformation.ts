import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

interface RedundantTransformMapping {
  methodName: string;
  valibotAction: string;
}

const REDUNDANT_TRANSFORM_MAPPINGS: RedundantTransformMapping[] = [
  { methodName: 'toLowerCase', valibotAction: 'toLowerCase' },
  { methodName: 'toUpperCase', valibotAction: 'toUpperCase' },
  { methodName: 'trim', valibotAction: 'trim' },
  { methodName: 'trimStart', valibotAction: 'trimStart' },
  { methodName: 'trimEnd', valibotAction: 'trimEnd' },
  { methodName: 'normalize', valibotAction: 'normalize' },
];

const METHOD_NAME_TO_ACTION = new Map(
  REDUNDANT_TRANSFORM_MAPPINGS.map((m) => [m.methodName, m.valibotAction]),
);

type Options = [];
type MessageIds = 'redundantTransform' | 'identityTransform';

export const noRedundantTransformation = createRule<Options, MessageIds>({
  name: 'no-redundant-transformation',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow redundant Valibot transform() actions.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      redundantTransform:
        "Use the built-in '{{valibotAction}}()' action instead of a manual transform() wrapper.",
      identityTransform:
        'Remove this identity transform(). It does not change the parsed value.',
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
          !isValibotCall(node, imports, 'transform')
        ) {
          return;
        }

        if (node.arguments.length !== 1) {
          return;
        }

        const callback = node.arguments[0];

        if (
          callback.type !== 'ArrowFunctionExpression' &&
          callback.type !== 'FunctionExpression'
        ) {
          return;
        }

        if (callback.async || callback.generator) {
          return;
        }

        if (callback.params.length !== 1) {
          return;
        }

        const param = callback.params[0];

        if (param.type !== 'Identifier') {
          return;
        }

        const paramName = param.name;

        const expression = getReturnExpression(callback.body);

        if (!expression) {
          return;
        }

        if (isIdentityReturn(expression, paramName)) {
          const removalRange = getTransformRemovalRange(node, imports);

          if (!removalRange) {
            return;
          }

          context.report({
            node,
            messageId: 'identityTransform',
            fix: hasCommentInRange(sourceCode.getAllComments(), removalRange)
              ? null
              : (fixer) => fixer.removeRange(removalRange),
          });
          return;
        }

        if (expression.type !== 'CallExpression') {
          return;
        }

        if (expression.arguments.length !== 0) {
          return;
        }

        if (expression.callee.type !== 'MemberExpression') {
          return;
        }

        if (expression.callee.computed) {
          return;
        }

        if (
          expression.callee.object.type !== 'Identifier' ||
          expression.callee.object.name !== paramName
        ) {
          return;
        }

        if (expression.callee.property.type !== 'Identifier') {
          return;
        }

        const methodName = expression.callee.property.name;
        const valibotAction = METHOD_NAME_TO_ACTION.get(methodName);

        if (!valibotAction) {
          return;
        }

        const preferredCalleeText = getPreferredCalleeText(
          node,
          imports,
          valibotAction,
        );

        context.report({
          node,
          messageId: 'redundantTransform',
          data: {
            valibotAction,
          },
          fix: preferredCalleeText
            ? (fixer) => fixer.replaceText(node, `${preferredCalleeText}()`)
            : null,
        });
      },
    };
  },
});

function isIdentityReturn(
  expression: TSESTree.Expression,
  paramName: string,
): boolean {
  return expression.type === 'Identifier' && expression.name === paramName;
}

function hasCommentInRange(
  comments: TSESTree.Comment[],
  range: TSESTree.Range,
): boolean {
  return comments.some(
    (comment) => comment.range[0] < range[1] && comment.range[1] > range[0],
  );
}

function getTransformRemovalRange(
  transformCall: TSESTree.CallExpression,
  imports: ValibotImports,
): TSESTree.Range | null {
  const parent = transformCall.parent;

  if (
    parent?.type !== 'CallExpression' ||
    !isValibotCall(parent, imports, 'pipe') ||
    !parent.arguments.includes(transformCall)
  ) {
    return null;
  }

  const actionIndex = parent.arguments.indexOf(transformCall);

  if (actionIndex <= 0) {
    return null;
  }

  const nextAction = parent.arguments[actionIndex + 1];

  if (nextAction) {
    return [transformCall.range[0], nextAction.range[0]];
  }

  const previousAction = parent.arguments[actionIndex - 1];

  if (!previousAction) {
    return transformCall.range;
  }

  return [previousAction.range[1], transformCall.range[1]];
}

function getReturnExpression(
  body: TSESTree.BlockStatement | TSESTree.Expression,
): TSESTree.Expression | null {
  if (body.type !== 'BlockStatement') {
    return body;
  }

  if (body.body.length !== 1) {
    return null;
  }

  const statement = body.body[0];

  if (statement.type === 'ReturnStatement') {
    return statement.argument ?? null;
  }

  return null;
}

function getPreferredCalleeText(
  call: TSESTree.CallExpression,
  imports: ValibotImports,
  valibotAction: string,
): string | null {
  if (call.callee.type === 'MemberExpression') {
    const namespace = getMemberNamespace(call.callee);

    if (!namespace) {
      return null;
    }

    return `${namespace}.${valibotAction}`;
  }

  const localActionName = getLocalImportName(imports, valibotAction);

  return localActionName ?? null;
}

function getMemberNamespace(callee: TSESTree.MemberExpression): string | null {
  if (callee.object.type === 'Identifier') {
    return callee.object.name;
  }

  return null;
}

function getLocalImportName(
  imports: ValibotImports,
  importedName: string,
): string | undefined {
  for (const [localName, importedValue] of imports.importedNames) {
    if (importedValue === importedName) {
      return localName;
    }
  }

  return undefined;
}
