import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallName } from '../utils/is-valibot-call';

const ASYNC_PARSE_NAMES = new Set(['parseAsync', 'safeParseAsync']);

// Reading these on the promise itself is how it is meant to be handled.
const PROMISE_PROPERTIES = new Set(['catch', 'finally', 'then']);

type Options = [];
type MessageIds = 'addAwait' | 'floatingPromise' | 'propertyOnPromise';

export const noUnawaitedParseAsync = createRule<Options, MessageIds>({
  name: 'no-unawaited-parse-async',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow using the result of Valibot parseAsync() or safeParseAsync() without awaiting it.',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      floatingPromise:
        '{{name}}() returns a promise that is never awaited or handled, so its result and any validation failure are lost.',
      propertyOnPromise:
        '{{name}}() returns a promise, so `{{property}}` is read from the promise and is always undefined. Await the call first.',
      addAwait: 'Await the {{name}}() call.',
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
        if (!hasValibotImports(imports)) {
          return;
        }

        const name = getValibotCallName(node, imports);

        if (!name || !ASYNC_PARSE_NAMES.has(name)) {
          return;
        }

        const parent = node.parent;
        const canAwait = isAwaitAllowed(node);
        const suggestAwait = (
          fix: TSESLint.ReportFixFunction,
        ): TSESLint.SuggestionReportDescriptor<MessageIds>[] =>
          canAwait ? [{ messageId: 'addAwait', data: { name }, fix }] : [];
        const awaitCall: TSESLint.ReportFixFunction = (fixer) =>
          fixer.insertTextBefore(node, 'await ');

        if (parent.type === 'ExpressionStatement') {
          context.report({
            node,
            messageId: 'floatingPromise',
            data: { name },
            suggest: suggestAwait(awaitCall),
          });
          return;
        }

        const directProperty = getNonPromisePropertyName(parent, node);

        if (directProperty) {
          context.report({
            node: parent,
            messageId: 'propertyOnPromise',
            data: { name, property: directProperty },
            suggest: suggestAwait((fixer) =>
              fixer.replaceText(node, `(await ${sourceCode.getText(node)})`),
            ),
          });
          return;
        }

        if (parent.type !== 'VariableDeclarator' || parent.init !== node) {
          return;
        }

        if (parent.id.type === 'ObjectPattern') {
          const property = parent.id.properties.find(
            (candidate): candidate is TSESTree.Property =>
              candidate.type === 'Property' &&
              !candidate.computed &&
              candidate.key.type === 'Identifier' &&
              !PROMISE_PROPERTIES.has(candidate.key.name),
          );

          if (property?.key.type === 'Identifier') {
            context.report({
              node: property,
              messageId: 'propertyOnPromise',
              data: { name, property: property.key.name },
              suggest: suggestAwait(awaitCall),
            });
          }

          return;
        }

        if (
          parent.id.type !== 'Identifier' ||
          parent.parent.type !== 'VariableDeclaration' ||
          parent.parent.kind !== 'const'
        ) {
          return;
        }

        for (const variable of sourceCode.getDeclaredVariables(parent)) {
          for (const reference of variable.references) {
            const property = getNonPromisePropertyName(
              reference.identifier.parent,
              reference.identifier,
            );

            if (property) {
              context.report({
                node: reference.identifier.parent,
                messageId: 'propertyOnPromise',
                data: { name, property },
                suggest: suggestAwait(awaitCall),
              });
            }
          }
        }
      },
    };

    // `await` is valid inside async functions and at the top level of modules.
    function isAwaitAllowed(node: TSESTree.Node): boolean {
      for (let current = node.parent; current; current = current.parent) {
        if (
          current.type === 'ArrowFunctionExpression' ||
          current.type === 'FunctionDeclaration' ||
          current.type === 'FunctionExpression'
        ) {
          return current.async;
        }
      }

      return sourceCode.ast.sourceType === 'module';
    }
  },
});

function getNonPromisePropertyName(
  node: TSESTree.Node | undefined,
  object: TSESTree.Node,
): string | null {
  if (
    node?.type !== 'MemberExpression' ||
    node.object !== object ||
    node.computed ||
    node.property.type !== 'Identifier' ||
    PROMISE_PROPERTIES.has(node.property.name)
  ) {
    return null;
  }

  return node.property.name;
}
