import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallName } from '../utils/is-valibot-call';

// Valibot runs these callbacks without catching errors, so a throw escapes
// safeParse() and friends. Values are the index of the callback argument.
const CALLBACK_ARGUMENT_INDEX = new Map([
  ['check', 0],
  ['checkAsync', 0],
  ['checkItems', 0],
  ['checkItemsAsync', 0],
  ['custom', 0],
  ['customAsync', 0],
  ['guard', 0],
  ['partialCheck', 1],
  ['partialCheckAsync', 1],
  ['rawCheck', 0],
  ['rawCheckAsync', 0],
  ['rawTransform', 0],
  ['rawTransformAsync', 0],
  ['transform', 0],
  ['transformAsync', 0],
]);

// Actions whose callback receives an `addIssue` helper for reporting issues.
const RAW_ACTION_NAMES = new Set([
  'rawCheck',
  'rawCheckAsync',
  'rawTransform',
  'rawTransformAsync',
]);

type Options = [];
type MessageIds = 'throwInCallback' | 'throwInRawCallback';

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

export const noThrowInCheck = createRule<Options, MessageIds>({
  name: 'no-throw-in-check',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow throwing inside Valibot check and transform callbacks, which escapes safeParse().',
    },
    schema: [],
    messages: {
      throwInCallback:
        'Throwing inside {{name}}() escapes safeParse() and crashes instead of producing an issue. Return false from a check, or use rawCheck()/rawTransform() and addIssue().',
      throwInRawCallback:
        'Throwing inside {{name}}() escapes safeParse() and crashes instead of producing an issue. Use addIssue() instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    let imports = createEmptyValibotImports();

    return {
      Program(node) {
        imports = collectValibotImports(node);
      },
      ThrowStatement(node) {
        if (!hasValibotImports(imports) || isCaughtLocally(node)) {
          return;
        }

        const callbackOwner = getCallbackOwnerName(node, imports);

        if (!callbackOwner) {
          return;
        }

        context.report({
          node,
          messageId: RAW_ACTION_NAMES.has(callbackOwner)
            ? 'throwInRawCallback'
            : 'throwInCallback',
          data: { name: callbackOwner },
        });
      },
    };
  },
});

function isFunctionNode(node: TSESTree.Node): node is FunctionNode {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  );
}

/**
 * Returns the Valibot API name when the nearest function enclosing `node` is
 * an inline callback passed to a check or transform action. Throws inside
 * nested helper functions are ignored, since they may be caught elsewhere.
 */
function getCallbackOwnerName(
  node: TSESTree.Node,
  imports: ValibotImports,
): string | null {
  let current = node.parent;

  while (current && !isFunctionNode(current)) {
    current = current.parent;
  }

  const call = current?.parent;

  if (!current || call?.type !== 'CallExpression') {
    return null;
  }

  const name = getValibotCallName(call, imports);
  const callbackIndex = name ? CALLBACK_ARGUMENT_INDEX.get(name) : undefined;

  return callbackIndex !== undefined &&
    call.arguments[callbackIndex] === current
    ? name
    : null;
}

// A throw inside a try block with a catch clause, within the same function,
// does not escape the callback.
function isCaughtLocally(node: TSESTree.Node): boolean {
  let current: TSESTree.Node = node;

  while (current.parent && !isFunctionNode(current.parent)) {
    const parent: TSESTree.Node = current.parent;

    if (
      parent.type === 'TryStatement' &&
      parent.block === current &&
      parent.handler !== null
    ) {
      return true;
    }

    current = parent;
  }

  return false;
}
