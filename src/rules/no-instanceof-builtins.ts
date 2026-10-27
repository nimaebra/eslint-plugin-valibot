import { ASTUtils } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';
import { getValibotCalleeText } from '../utils/callee-text';

const BUILTIN_CONSTRUCTORS = new Map<string, string>([
  ['Date', 'date'],
  ['Array', 'array'],
  ['Function', 'function'],
  ['Promise', 'promise'],
  ['Map', 'map'],
  ['Set', 'set'],
  ['String', 'string'],
  ['Number', 'number'],
  ['Boolean', 'boolean'],
  ['Symbol', 'symbol'],
  ['BigInt', 'bigint'],
  ['Blob', 'blob'],
]);

type Options = [];
type MessageIds = 'noInstanceofBuiltins' | 'replaceWithNativeSchema';

// These schemas need element/key/value schemas that the rule cannot infer.
const COLLECTION_CONSTRUCTORS = new Set(['Array', 'Map', 'Set']);

export const noInstanceofBuiltins = createRule<Options, MessageIds>({
  name: 'no-instanceof-builtins',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer native Valibot schemas over instance(Constructor) for built-in types.',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      noInstanceofBuiltins:
        'Consider the native Valibot {{preferred}} schema instead of instance({{constructor}}); its accepted values may differ.',
      replaceWithNativeSchema:
        'Replace with {{preferred}}() (changes which values are accepted).',
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
        if (!hasValibotImports(imports)) {
          return;
        }

        if (
          !isValibotCall(node, imports, 'instance') ||
          node.arguments.length !== 1
        ) {
          return;
        }

        const arg = node.arguments[0];

        if (arg.type !== 'Identifier') {
          return;
        }

        const constructorName = arg.name;
        const preferredSchema = BUILTIN_CONSTRUCTORS.get(constructorName);

        if (
          !preferredSchema ||
          ASTUtils.findVariable(context.sourceCode.getScope(arg), arg)?.defs
            .length
        ) {
          return;
        }

        const preferredCalleeText = getValibotCalleeText(
          node,
          imports,
          preferredSchema,
        );
        const preferredBinding =
          node.callee.type === 'Identifier' && preferredCalleeText
            ? ASTUtils.findVariable(
                context.sourceCode.getScope(node),
                preferredCalleeText,
              )
            : null;
        const replacementIsShadowed =
          preferredBinding !== null &&
          preferredBinding.scope.type !== 'module' &&
          preferredBinding.scope.type !== 'global';

        context.report({
          node,
          messageId: 'noInstanceofBuiltins',
          data: {
            preferred: preferredSchema,
            constructor: constructorName,
          },
          suggest:
            preferredCalleeText &&
            !replacementIsShadowed &&
            !COLLECTION_CONSTRUCTORS.has(constructorName) &&
            context.sourceCode.getCommentsInside(node).length === 0
              ? [
                  {
                    messageId: 'replaceWithNativeSchema',
                    data: { preferred: preferredSchema },
                    fix(fixer) {
                      return fixer.replaceText(
                        node,
                        `${preferredCalleeText}()`,
                      );
                    },
                  },
                ]
              : [],
        });
      },
    };
  },
});
