import {
  ASTUtils,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallName } from '../utils/is-valibot-call';

const GUARDED_FUNCTIONS = ['parse', 'assert', 'parseAsync'] as const;

type GuardedFunction = (typeof GUARDED_FUNCTIONS)[number];

// The non-throwing alternative suggested for each guarded function.
const SAFE_ALTERNATIVES: Record<GuardedFunction, string> = {
  assert: 'is',
  parse: 'safeParse',
  parseAsync: 'safeParseAsync',
};

type Options = [
  {
    allowAtModuleScope?: boolean;
    allowInFunctions?: string[];
    functions?: GuardedFunction[];
  },
];
type MessageIds = 'unguardedParserCall';

export const noUnguardedParse = createRule<Options, MessageIds>({
  name: 'no-unguarded-parse',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require Valibot parse(), assert() and parseAsync() calls to be guarded against validation errors.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowAtModuleScope: {
            type: 'boolean',
            description:
              'Allow unguarded calls outside of any function, such as fail-fast environment validation at startup.',
          },
          allowInFunctions: {
            type: 'array',
            description:
              'Names of enclosing functions whose thrown validation errors are handled elsewhere, such as framework route handlers.',
            items: { type: 'string' },
            uniqueItems: true,
          },
          functions: {
            type: 'array',
            description: 'Throwing Valibot functions to check.',
            items: { type: 'string', enum: [...GUARDED_FUNCTIONS] },
            uniqueItems: true,
          },
        },
      },
    ],
    messages: {
      unguardedParserCall:
        'Wrap Valibot {{functionName}}() in a try/catch block or switch to {{safeFunctionName}}() for recoverable validation.',
    },
  },
  defaultOptions: [
    {
      allowAtModuleScope: false,
      allowInFunctions: [],
      functions: [...GUARDED_FUNCTIONS],
    },
  ],
  create(context, [options]) {
    let imports = createEmptyValibotImports();
    const sourceCode = context.sourceCode;
    const checkedFunctions = new Set<string>(
      options.functions ?? GUARDED_FUNCTIONS,
    );
    const allowedFunctionNames = new Set(options.allowInFunctions ?? []);

    return {
      Program(node) {
        imports = collectValibotImports(node);
      },
      CallExpression(node) {
        if (!hasValibotImports(imports)) {
          return;
        }

        const functionName = getGuardedFunctionName(
          node,
          imports,
          checkedFunctions,
        );

        if (!functionName) {
          return;
        }

        const promiseChain =
          functionName === 'parseAsync'
            ? getPromiseChain(node, sourceCode)
            : null;
        const guardedNode = promiseChain
          ? promiseChain.end.parent.type === 'AwaitExpression'
            ? promiseChain.end.parent
            : null
          : node;

        if (
          promiseChain?.hasRejectionHandler ||
          isInsideTryWithCatch(guardedNode)
        ) {
          return;
        }

        const enclosingFunctionNames = getEnclosingFunctionNames(node);

        if (
          enclosingFunctionNames === null
            ? options.allowAtModuleScope
            : enclosingFunctionNames.some((name) =>
                allowedFunctionNames.has(name),
              )
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'unguardedParserCall',
          data: {
            functionName,
            safeFunctionName: SAFE_ALTERNATIVES[functionName],
          },
        });
      },
    };
  },
});

function getGuardedFunctionName(
  call: TSESTree.CallExpression,
  imports: ValibotImports,
  checkedFunctions: Set<string>,
): GuardedFunction | null {
  const name = getValibotCallName(call, imports);

  return name !== null && checkedFunctions.has(name)
    ? (name as GuardedFunction)
    : null;
}

// A `try` without `catch` still lets the validation error escape.
function isInsideTryWithCatch(node: TSESTree.Node | null): boolean {
  let current = node;

  while (current?.parent) {
    const parent: TSESTree.Node = current.parent;

    if (
      parent.type === 'FunctionDeclaration' ||
      parent.type === 'FunctionExpression' ||
      parent.type === 'ArrowFunctionExpression'
    ) {
      return false;
    }

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

// Follow promise methods so a later rejection handler or await can guard the call.
function getPromiseChain(
  call: TSESTree.CallExpression,
  sourceCode: TSESLint.SourceCode,
): { end: TSESTree.CallExpression; hasRejectionHandler: boolean } {
  let end = call;
  let hasRejectionHandler = false;

  while (end.parent.type === 'MemberExpression') {
    const member = end.parent;
    const chainedCall = member.parent;
    const method = ASTUtils.getPropertyName(
      member,
      sourceCode.getScope(member),
    );

    if (
      member.object !== end ||
      member.optional ||
      chainedCall.type !== 'CallExpression' ||
      chainedCall.callee !== member ||
      chainedCall.optional ||
      (method !== 'catch' && method !== 'then' && method !== 'finally')
    ) {
      break;
    }

    const handler =
      method === 'catch'
        ? chainedCall.arguments[0]
        : method === 'then'
          ? chainedCall.arguments[1]
          : undefined;

    if (handler && handler.type !== 'SpreadElement') {
      const value = ASTUtils.getStaticValue(
        handler,
        sourceCode.getScope(handler),
      );

      // Named handlers may be unknown without type information. Known values
      // such as undefined, null and false cannot handle a rejection.
      hasRejectionHandler ||=
        value === null || typeof value.value === 'function';
    }

    end = chainedCall;
  }

  return { end, hasRejectionHandler };
}

/**
 * Returns the names of all enclosing functions from innermost to outermost,
 * or `null` when the node is at module scope. Anonymous functions are skipped
 * so that `export async function action() { items.map((item) => parse(...)) }`
 * still matches `action`.
 */
function getEnclosingFunctionNames(node: TSESTree.Node): string[] | null {
  const names: string[] = [];
  let isInsideFunction = false;

  // `Program.parent` is `null` at runtime, even though it is typed optional.
  for (let current = node.parent; current; current = current.parent) {
    if (
      current.type !== 'FunctionDeclaration' &&
      current.type !== 'FunctionExpression' &&
      current.type !== 'ArrowFunctionExpression'
    ) {
      continue;
    }

    isInsideFunction = true;

    const name = getFunctionName(current);

    if (name) {
      names.push(name);
    }
  }

  return isInsideFunction ? names : null;
}

function getFunctionName(
  fn:
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression,
): string | null {
  if (fn.id) {
    return fn.id.name;
  }

  const parent = fn.parent;

  if (
    parent?.type === 'VariableDeclarator' &&
    parent.id.type === 'Identifier'
  ) {
    return parent.id.name;
  }

  if (
    (parent?.type === 'Property' ||
      parent?.type === 'MethodDefinition' ||
      parent?.type === 'PropertyDefinition') &&
    !parent.computed &&
    parent.key.type === 'Identifier'
  ) {
    return parent.key.name;
  }

  return null;
}
