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
  { methodName: 'toLocaleLowerCase', valibotAction: 'toLowerCase' },
  { methodName: 'toUpperCase', valibotAction: 'toUpperCase' },
  { methodName: 'toLocaleUpperCase', valibotAction: 'toUpperCase' },
  { methodName: 'trim', valibotAction: 'trim' },
  { methodName: 'trimStart', valibotAction: 'trimStart' },
  { methodName: 'trimEnd', valibotAction: 'trimEnd' },
  { methodName: 'normalize', valibotAction: 'normalize' },
  { methodName: 'toWellFormed', valibotAction: 'toWellFormed' },
];

const METHOD_NAME_TO_ACTION = new Map(
  REDUNDANT_TRANSFORM_MAPPINGS.map((m) => [m.methodName, m.valibotAction]),
);

type Options = [];
type MessageIds = 'redundantTransform';

export const noRedundantTransformation = createRule<Options, MessageIds>({
  name: 'no-redundant-transformation',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow redundant manual transformations that duplicate built-in Valibot actions.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      redundantTransform:
        "Use the built-in '{{valibotAction}}()' action instead of a manual transform() wrapper.",
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
            ? (fixer) =>
                fixer.replaceText(node, `${preferredCalleeText}()`)
            : null,
        });
      },
    };
  },
});

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

    const localActionName = getLocalImportName(imports, valibotAction);

    return `${namespace}.${localActionName ?? valibotAction}`;
  }

  const localActionName = getLocalImportName(imports, valibotAction);

  return localActionName ?? null;
}

function getMemberNamespace(
  callee: TSESTree.MemberExpression,
): string | null {
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
