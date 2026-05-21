import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

const GUARDED_PARSER_NAMES = ['parse', 'assert'] as const;

type Options = [];
type MessageIds = 'unguardedParserCall';

export const noUnguardedParse = createRule<Options, MessageIds>({
  name: 'no-unguarded-parse',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require Valibot parse() and assert() calls to be wrapped in try/catch.',
    },
    schema: [],
    messages: {
      unguardedParserCall:
        'Wrap Valibot {{functionName}}() in a try/catch block or switch to safeParse() for recoverable validation.',
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

        const parserName = getGuardedParserName(node, imports);

        if (!parserName || isInsideTryBlock(node)) {
          return;
        }

        context.report({
          node,
          messageId: 'unguardedParserCall',
          data: {
            functionName: parserName,
          },
        });
      },
    };
  },
});

function getGuardedParserName(
  call: TSESTree.CallExpression,
  imports: ValibotImports,
): (typeof GUARDED_PARSER_NAMES)[number] | null {
  for (const functionName of GUARDED_PARSER_NAMES) {
    if (isValibotCall(call, imports, functionName)) {
      return functionName;
    }
  }

  return null;
}

function isInsideTryBlock(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node;

  while (current?.parent) {
    const parent: TSESTree.Node = current.parent;

    if (parent.type === 'TryStatement' && parent.block === current) {
      return true;
    }

    current = parent;
  }

  return false;
}
