import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallName } from '../utils/is-valibot-call';

const SAFE_PARSE_NAMES = new Set(['safeParse', 'safeParseAsync']);

type Options = [];
type MessageIds = 'uncheckedOutput';

export const noUncheckedSafeParse = createRule<Options, MessageIds>({
  name: 'no-unchecked-safe-parse',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require checking the success of a Valibot safeParse() result before reading its output.',
    },
    schema: [],
    messages: {
      uncheckedOutput:
        'Check `success` before reading `output` from {{name}}(). When validation fails, `output` holds the unvalidated input.',
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

        if (!name || !SAFE_PARSE_NAMES.has(name)) {
          return;
        }

        // Un-awaited safeParseAsync() results are a promise; that mistake is
        // reported by no-unawaited-parse-async instead.
        const result: TSESTree.Node =
          node.parent?.type === 'AwaitExpression' ? node.parent : node;

        if (name === 'safeParseAsync' && result === node) {
          return;
        }

        const report = (reportNode: TSESTree.Node) =>
          context.report({
            node: reportNode,
            messageId: 'uncheckedOutput',
            data: { name },
          });

        const parent = result.parent;

        if (isOutputAccess(parent, result)) {
          report(parent);
          return;
        }

        if (parent?.type !== 'VariableDeclarator' || parent.init !== result) {
          return;
        }

        if (parent.id.type === 'ObjectPattern') {
          const outputProperty = getDestructuredOutputWithoutSuccess(parent.id);

          if (outputProperty) {
            report(outputProperty);
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

        const resultName = parent.id.name;

        for (const variable of sourceCode.getDeclaredVariables(parent)) {
          for (const reference of variable.references) {
            const identifier = reference.identifier;
            const member = identifier.parent;

            if (
              isOutputAccess(member, identifier) &&
              !isGuardedBySuccessCheck(member, resultName)
            ) {
              report(member);
            }
          }
        }
      },
    };
  },
});

function isOutputAccess(
  node: TSESTree.Node | undefined,
  object: TSESTree.Node,
): node is TSESTree.MemberExpression {
  return (
    node?.type === 'MemberExpression' &&
    node.object === object &&
    !node.computed &&
    node.property.type === 'Identifier' &&
    node.property.name === 'output'
  );
}

function getDestructuredOutputWithoutSuccess(
  pattern: TSESTree.ObjectPattern,
): TSESTree.Property | null {
  let outputProperty: TSESTree.Property | null = null;

  for (const property of pattern.properties) {
    if (property.type === 'RestElement') {
      return null;
    }

    const key = getStaticKeyName(property);

    if (key === 'success') {
      return null;
    }

    if (key === 'output') {
      outputProperty = property;
    }
  }

  return outputProperty;
}

function getStaticKeyName(property: TSESTree.Property): string | null {
  if (!property.computed && property.key.type === 'Identifier') {
    return property.key.name;
  }

  return property.key.type === 'Literal' &&
    typeof property.key.value === 'string'
    ? property.key.value
    : null;
}

function isGuardedBySuccessCheck(
  node: TSESTree.Node,
  resultName: string,
): boolean {
  const ifTruthy = (test: TSESTree.Node) =>
    truthyImpliesSuccess(test, resultName);
  const ifFalsy = (test: TSESTree.Node) =>
    falsyImpliesSuccess(test, resultName);

  let child: TSESTree.Node = node;

  for (let current = node.parent; current; current = current.parent) {
    switch (current.type) {
      case 'IfStatement':
      case 'ConditionalExpression':
        if (
          (child === current.consequent && ifTruthy(current.test)) ||
          (child === current.alternate && ifFalsy(current.test))
        ) {
          return true;
        }
        break;

      case 'LogicalExpression':
        if (
          child === current.right &&
          ((current.operator === '&&' && ifTruthy(current.left)) ||
            (current.operator === '||' && ifFalsy(current.left)))
        ) {
          return true;
        }
        break;

      case 'BlockStatement':
      case 'Program':
      case 'StaticBlock':
        if (hasPrecedingExitOnFailure(current.body, child, resultName)) {
          return true;
        }
        break;

      case 'SwitchCase':
        if (hasPrecedingExitOnFailure(current.consequent, child, resultName)) {
          return true;
        }
        break;
    }

    child = current;
  }

  return false;
}

// Matches `if (!result.success) return;` and `if (result.success) {} else throw`
// before the statement that reads `output`.
function hasPrecedingExitOnFailure(
  statements: TSESTree.Node[],
  child: TSESTree.Node,
  resultName: string,
): boolean {
  const index = statements.indexOf(child);

  return statements
    .slice(0, Math.max(index, 0))
    .some(
      (statement) =>
        statement.type === 'IfStatement' &&
        ((alwaysExits(statement.consequent) &&
          falsyImpliesSuccess(statement.test, resultName)) ||
          (statement.alternate !== null &&
            alwaysExits(statement.alternate) &&
            truthyImpliesSuccess(statement.test, resultName))),
    );
}

function alwaysExits(statement: TSESTree.Statement): boolean {
  switch (statement.type) {
    case 'BreakStatement':
    case 'ContinueStatement':
    case 'ReturnStatement':
    case 'ThrowStatement':
      return true;
    case 'BlockStatement': {
      const last = statement.body.at(-1);

      return last !== undefined && alwaysExits(last);
    }
    default:
      return false;
  }
}

// Whether `test` being truthy guarantees `result.success`.
function truthyImpliesSuccess(
  test: TSESTree.Node,
  resultName: string,
): boolean {
  switch (test.type) {
    case 'MemberExpression':
      return isSuccessAccess(test, resultName);
    case 'UnaryExpression':
      return (
        test.operator === '!' && falsyImpliesSuccess(test.argument, resultName)
      );
    case 'BinaryExpression':
      return getSuccessComparison(test, resultName) === true;
    case 'LogicalExpression':
      return test.operator === '&&'
        ? truthyImpliesSuccess(test.left, resultName) ||
            truthyImpliesSuccess(test.right, resultName)
        : test.operator === '||' &&
            truthyImpliesSuccess(test.left, resultName) &&
            truthyImpliesSuccess(test.right, resultName);
    default:
      return false;
  }
}

// Whether `test` being falsy guarantees `result.success`.
function falsyImpliesSuccess(test: TSESTree.Node, resultName: string): boolean {
  switch (test.type) {
    case 'UnaryExpression':
      return (
        test.operator === '!' && truthyImpliesSuccess(test.argument, resultName)
      );
    case 'BinaryExpression':
      return getSuccessComparison(test, resultName) === false;
    case 'LogicalExpression':
      return test.operator === '||'
        ? falsyImpliesSuccess(test.left, resultName) ||
            falsyImpliesSuccess(test.right, resultName)
        : test.operator === '&&' &&
            falsyImpliesSuccess(test.left, resultName) &&
            falsyImpliesSuccess(test.right, resultName);
    default:
      return false;
  }
}

/**
 * For `result.success === true` and similar comparisons, returns `true` when
 * the comparison holding implies success and `false` when it implies failure.
 * `success` is always a boolean, so `=== false` failing implies success.
 */
function getSuccessComparison(
  test: TSESTree.BinaryExpression,
  resultName: string,
): boolean | null {
  const [access, literal] = isSuccessAccess(test.left, resultName)
    ? [test.left, test.right]
    : [test.right, test.left];

  if (
    !isSuccessAccess(access, resultName) ||
    literal.type !== 'Literal' ||
    typeof literal.value !== 'boolean'
  ) {
    return null;
  }

  switch (test.operator) {
    case '===':
    case '==':
      return literal.value;
    case '!==':
    case '!=':
      return !literal.value;
    default:
      return null;
  }
}

function isSuccessAccess(node: TSESTree.Node, resultName: string): boolean {
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object.type === 'Identifier' &&
    node.object.name === resultName &&
    node.property.type === 'Identifier' &&
    node.property.name === 'success'
  );
}
