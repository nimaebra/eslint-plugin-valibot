import type { TSESTree } from '@typescript-eslint/utils';

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

        for (const actions of getPipeActionGroups(node)) {
          const lastTrimIndex = actions.findLastIndex((action) =>
            TRIM_ACTION_NAMES.has(action.name),
          );

          if (lastTrimIndex === -1) {
            continue;
          }

          const offendingChecks = actions
            .slice(0, lastTrimIndex)
            .filter((action) => LOWER_BOUND_CHECK_NAMES.has(action.name));

          if (offendingChecks.length === 0) {
            continue;
          }

          const canSuggest =
            !node.arguments.some(
              (argument) => argument.type === 'SpreadElement',
            ) && sourceCode.getCommentsInside(node).length === 0;

          for (const check of offendingChecks) {
            const trimIndex = actions.findIndex(
              (action, index) =>
                index > actions.indexOf(check) &&
                TRIM_ACTION_NAMES.has(action.name),
            );
            const trim = actions[trimIndex];
            const previousTrimIndex = actions
              .slice(0, trimIndex)
              .findLastIndex((action) => TRIM_ACTION_NAMES.has(action.name));
            const firstCheck = offendingChecks.find(
              (candidate) => actions.indexOf(candidate) > previousTrimIndex,
            )!;
            const data = {
              check: check.name,
              trim: trim.name,
            };

            context.report({
              node: check.node,
              messageId: 'lengthCheckBeforeTrim',
              data,
              suggest: canSuggest
                ? [
                    {
                      messageId: 'moveTrimBeforeCheck',
                      data: { check: firstCheck.name, trim: trim.name },
                      fix(fixer) {
                        const trimIndex = node.arguments.indexOf(trim.node);
                        const previousArgument = node.arguments[trimIndex - 1];

                        return [
                          fixer.insertTextBefore(
                            firstCheck.node,
                            `${sourceCode.getText(trim.node)}, `,
                          ),
                          fixer.removeRange([
                            previousArgument.range[1],
                            trim.node.range[1],
                          ]),
                        ];
                      },
                    },
                  ]
                : [],
            });
          }
        }
      },
    };

    function getPipeActionGroups(
      pipeCall: TSESTree.CallExpression,
    ): PipeAction[][] {
      const groups: PipeAction[][] = [];
      let group: PipeAction[] = [];
      for (const argument of pipeCall.arguments.slice(1)) {
        const name =
          argument.type === 'CallExpression'
            ? getValibotCallName(argument, imports)
            : null;
        if (
          argument.type !== 'CallExpression' ||
          !name ||
          (!TRIM_ACTION_NAMES.has(name) &&
            !VALUE_PRESERVING_ACTION_NAMES.has(name))
        ) {
          group = [];
          continue;
        }
        if (!group.length) groups.push(group);
        group.push({ name, node: argument });
      }
      return groups;
    }
  },
});
