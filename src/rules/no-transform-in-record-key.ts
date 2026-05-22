import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';
import {
  getPipeActionDescriptors,
  type PipeActionDescriptor,
} from '../utils/pipe-analysis';

const EXPLICIT_KEY_MUTATION_ACTION_NAMES = new Set([
  'normalize',
  'rawTransform',
  'transform',
  'trim',
  'trimEnd',
  'trimStart',
]);

type Options = [];
type MessageIds = 'transformInRecordKey';

export const noTransformInRecordKey = createRule<Options, MessageIds>({
  name: 'no-transform-in-record-key',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow transforms in record() key schemas, which can silently mutate keys and cause collisions.',
    },
    schema: [],
    messages: {
      transformInRecordKey:
        "Avoid using '{{actionName}}()' in a record() key schema. Transformed record keys can change silently and collide during parsing.",
    },
  },
  defaultOptions: [],
  create(context) {
    let imports = createEmptyValibotImports();
    const sourceCode = context.sourceCode as Readonly<
      TSESLint.SourceCode & {
        getScope(node: TSESTree.Node): ScopeLike;
      }
    >;

    return {
      Program(node) {
        imports = collectValibotImports(node);
      },
      CallExpression(node) {
        if (
          !hasValibotImports(imports) ||
          !isValibotCall(node, imports, 'record')
        ) {
          return;
        }

        for (const action of getTransformingKeyActions(
          node.arguments[0],
          imports,
          sourceCode,
        )) {
          context.report({
            node: action.node,
            messageId: 'transformInRecordKey',
            data: {
              actionName: action.name,
            },
          });
        }
      },
    };
  },
});

interface VariableLike {
  defs: Array<{
    node: TSESTree.Node;
  }>;
}

interface ScopeLike {
  set: Map<string, VariableLike>;
  upper: ScopeLike | null;
}

function getTransformingKeyActions(
  node: TSESTree.Node | null | undefined,
  imports: ValibotImports,
  sourceCode: Readonly<
    TSESLint.SourceCode & {
      getScope(node: TSESTree.Node): ScopeLike;
    }
  >,
  visitedNodes = new Set<TSESTree.Node>(),
): PipeActionDescriptor[] {
  if (!node || visitedNodes.has(node)) {
    return [];
  }

  visitedNodes.add(node);

  if (node.type === 'Identifier') {
    const resolvedExpression = resolveIdentifierExpression(node, sourceCode);

    return resolvedExpression
      ? getTransformingKeyActions(
          resolvedExpression,
          imports,
          sourceCode,
          visitedNodes,
        )
      : [];
  }

  if (node.type !== 'CallExpression') {
    return [];
  }

  const transformingActions = isValibotCall(node, imports, 'pipe')
    ? getPipeActionDescriptors(node, imports, sourceCode).filter((action) =>
        isTransformingKeyActionName(action.name),
      )
    : [];

  return [
    ...transformingActions,
    ...node.arguments.flatMap((argument) =>
      getTransformingKeyActions(argument, imports, sourceCode, visitedNodes),
    ),
  ];
}

function resolveIdentifierExpression(
  node: TSESTree.Identifier,
  sourceCode: Readonly<
    TSESLint.SourceCode & {
      getScope(node: TSESTree.Node): ScopeLike;
    }
  >,
): TSESTree.Expression | null {
  let scope: ScopeLike | null = sourceCode.getScope(node);

  while (scope) {
    const definition = scope.set.get(node.name)?.defs[0];

    if (definition?.node.type === 'VariableDeclarator') {
      return definition.node.init ?? null;
    }

    scope = scope.upper;
  }

  return null;
}

function isTransformingKeyActionName(name: string): boolean {
  return EXPLICIT_KEY_MUTATION_ACTION_NAMES.has(name) || /^to[A-Z]/u.test(name);
}
