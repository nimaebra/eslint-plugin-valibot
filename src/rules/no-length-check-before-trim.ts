import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallName } from '../utils/is-valibot-call';
import { VALUE_PRESERVING_ACTION_NAMES } from '../utils/pipe-analysis';

// Checks that whitespace can satisfy before it is trimmed away. Upper bounds
// such as maxLength() are excluded: checking them before trimming is stricter,
// and is a common way to cap raw input size.
const LOWER_BOUND_CHECK_NAMES = new Set([
  'bytes',
  'codePoints',
  'graphemes',
  'length',
  'minBytes',
  'minCodePoints',
  'minGraphemes',
  'minLength',
  'minWords',
  'nonEmpty',
  'words',
]);

const TRIM_ACTION_NAMES = new Set(['trim', 'trimEnd', 'trimStart']);

const PIPE_NAMES = new Set(['pipe', 'pipeAsync']);

type Options = [];
type MessageIds = 'lengthCheckBeforeTrim' | 'moveTrimBeforeCheck';

interface PipeAction {
  name: string;
  node: TSESTree.CallExpression;
}

export const noLengthCheckBeforeTrim = createRule<Options, MessageIds>({
  name: 'no-length-check-before-trim',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow minimum length and emptiness checks before trim() in the same pipe, where whitespace can satisfy them.',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      lengthCheckBeforeTrim:
        '{{check}}() runs before {{trim}}(), so whitespace-only input can pass it and then be trimmed away. Move {{trim}}() before {{check}}().',
      moveTrimBeforeCheck: 'Move {{trim}}() before {{check}}().',
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
        if (!hasValibotImports(imports)) {
          return;
        }

        const pipeName = getValibotCallName(node, imports);

        if (!pipeName || !PIPE_NAMES.has(pipeName)) {
          return;
        }

        const checks: PipeAction[] = [];
        let canSuggest: boolean | undefined;
        for (let index = 1; index < node.arguments.length; index++) {
          const argument = node.arguments[index];
          const name =
            argument.type === 'CallExpression'
              ? getValibotCallName(argument, imports)
              : null;
          const isTrim = name !== null && TRIM_ACTION_NAMES.has(name);

          if (
            argument.type !== 'CallExpression' ||
            !name ||
            (!isTrim && !VALUE_PRESERVING_ACTION_NAMES.has(name))
          ) {
            checks.length = 0;
            continue;
          }
          if (LOWER_BOUND_CHECK_NAMES.has(name)) {
            checks.push({ name, node: argument });
            continue;
          }
          if (!isTrim || checks.length === 0) continue;

          canSuggest ??=
            !node.arguments.some((item) => item.type === 'SpreadElement') &&
            sourceCode.getCommentsInside(node).length === 0;
          const firstCheck = checks[0];
          const previousArgument = node.arguments[index - 1];
          const trimText = canSuggest ? sourceCode.getText(argument) : '';
          const suggest: TSESLint.ReportSuggestionArray<MessageIds> = canSuggest
            ? [
                {
                  messageId: 'moveTrimBeforeCheck',
                  data: { check: firstCheck.name, trim: name },
                  fix: (fixer) => [
                    fixer.insertTextBefore(firstCheck.node, `${trimText}, `),
                    fixer.removeRange([
                      previousArgument.range[1],
                      argument.range[1],
                    ]),
                  ],
                },
              ]
            : [];

          for (const check of checks) {
            context.report({
              node: check.node,
              messageId: 'lengthCheckBeforeTrim',
              data: { check: check.name, trim: name },
              suggest,
            });
          }
          checks.length = 0;
        }
      },
    };
  },
});
