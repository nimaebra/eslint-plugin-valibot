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
        imports = collectValibotImports(node, context.sourceCode);
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

        const results = new Set<TSESLint.Scope.Variable>();
        const successes = new Set<TSESLint.Scope.Variable>();
        const reads: TSESTree.Node[] = [];
        const pending = [parent];
        const visited = new Set<TSESTree.VariableDeclarator>();
        const stable = (variable: TSESLint.Scope.Variable) =>
          !variable.references.some(
            (reference) => reference.isWrite() && !reference.init,
          );

        while (pending.length) {
          const declaration = pending.pop()!;
          if (visited.has(declaration)) continue;
          visited.add(declaration);
          const variables = sourceCode.getDeclaredVariables(declaration);
          if (declaration.id.type === 'ObjectPattern') {
            const properties = declaration.id.properties;
            const output = properties.find(
              (property) =>
                property.type === 'Property' &&
                getStaticKeyName(property) === 'output',
            );
            const success = properties.find(
              (property) =>
                property.type === 'Property' &&
                getStaticKeyName(property) === 'success',
            );
            const rest = properties.find(
              (property) => property.type === 'RestElement',
            );
            if (output && !success && !rest) {
              reads.push(output);
              continue;
            }
            for (const variable of variables) {
              if (!stable(variable)) continue;
              if (
                success?.type === 'Property' &&
                success.value === variable.identifiers[0]
              )
                successes.add(variable);
              if (rest?.argument === variable.identifiers[0])
                results.add(variable);
              if (
                output?.type === 'Property' &&
                output.value === variable.identifiers[0]
              ) {
                reads.push(
                  ...variable.references
                    .filter((reference) => reference.isRead())
                    .map((reference) => reference.identifier),
                );
              }
            }
            continue;
          }
          if (declaration.id.type !== 'Identifier') continue;
          const variable = variables[0];
          if (!variable || !stable(variable)) continue;
          results.add(variable);
          for (const reference of variable.references) {
            const identifier = reference.identifier;
            const member = identifier.parent;
            if (isOutputAccess(member, identifier)) reads.push(member);
            if (
              member.type === 'VariableDeclarator' &&
              member.init === identifier
            )
              pending.push(member);
          }
        }

        const findVariable = (identifier: TSESTree.Identifier) =>
          ASTUtils.findVariable(
            sourceCode.getScope(identifier),
            identifier.name,
          );
        const isSuccess: SuccessCheck = (expression) => {
          if (expression.type === 'Identifier') {
            const variable = findVariable(expression);
            return Boolean(variable && successes.has(variable));
          }
          if (
            expression.type !== 'MemberExpression' ||
            getMemberName(expression) !== 'success' ||
            expression.object.type !== 'Identifier'
          )
            return false;
          const variable = findVariable(expression.object);
          return Boolean(variable && results.has(variable));
        };
        const mutated = [...results].some((variable) =>
          variable.references.some((reference) => {
            const member = reference.identifier.parent;
            if (
              member.type !== 'MemberExpression' ||
              member.object !== reference.identifier
            )
              return false;
            const operation = member.parent;
            return (
              (operation.type === 'AssignmentExpression' &&
                operation.left === member) ||
              operation.type === 'UpdateExpression' ||
              (operation.type === 'UnaryExpression' &&
                operation.operator === 'delete')
            );
          }),
        );
        for (const read of reads) {
          if (mutated || !isGuardedBySuccessCheck(read, isSuccess))
            report(read);
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
    getMemberName(node) === 'output'
  );
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
  isSuccess: SuccessCheck,
): boolean {
  const ifTruthy = (test: TSESTree.Node) =>
    truthyImpliesSuccess(test, isSuccess);
  const ifFalsy = (test: TSESTree.Node) => falsyImpliesSuccess(test, isSuccess);

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
        if (hasPrecedingExitOnFailure(current.body, child, isSuccess)) {
          return true;
        }
        break;

      case 'SwitchCase':
        if (hasPrecedingExitOnFailure(current.consequent, child, isSuccess)) {
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
  isSuccess: SuccessCheck,
): boolean {
  const index = statements.indexOf(child);

  return statements
    .slice(0, Math.max(index, 0))
    .some(
      (statement) =>
        statement.type === 'IfStatement' &&
        ((alwaysExits(statement.consequent) &&
          falsyImpliesSuccess(statement.test, isSuccess)) ||
          (statement.alternate !== null &&
            alwaysExits(statement.alternate) &&
            truthyImpliesSuccess(statement.test, isSuccess))),
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
  isSuccess: SuccessCheck,
): boolean {
  switch (test.type) {
    case 'Identifier':
    case 'MemberExpression':
      return isSuccess(test);
    case 'UnaryExpression':
      return (
        test.operator === '!' && falsyImpliesSuccess(test.argument, isSuccess)
      );
    case 'BinaryExpression':
      return getSuccessComparison(test, isSuccess) === true;
    case 'LogicalExpression':
      return test.operator === '&&'
        ? truthyImpliesSuccess(test.left, isSuccess) ||
            truthyImpliesSuccess(test.right, isSuccess)
        : test.operator === '||' &&
            truthyImpliesSuccess(test.left, isSuccess) &&
            truthyImpliesSuccess(test.right, isSuccess);
    default:
      return false;
  }
}

// Whether `test` being falsy guarantees `result.success`.
function falsyImpliesSuccess(
  test: TSESTree.Node,
  isSuccess: SuccessCheck,
): boolean {
  switch (test.type) {
    case 'UnaryExpression':
      return (
        test.operator === '!' && truthyImpliesSuccess(test.argument, isSuccess)
      );
    case 'BinaryExpression':
      return getSuccessComparison(test, isSuccess) === false;
    case 'LogicalExpression':
      return test.operator === '||'
        ? falsyImpliesSuccess(test.left, isSuccess) ||
            falsyImpliesSuccess(test.right, isSuccess)
        : test.operator === '&&' &&
            falsyImpliesSuccess(test.left, isSuccess) &&
            falsyImpliesSuccess(test.right, isSuccess);
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
  isSuccess: SuccessCheck,
): boolean | null {
  const [access, literal] = isSuccess(test.left)
    ? [test.left, test.right]
    : [test.right, test.left];

  if (
    !isSuccess(access) ||
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

type SuccessCheck = (node: TSESTree.Node) => boolean;

function getMemberName(node: TSESTree.MemberExpression): string | null {
  if (!node.computed && node.property.type === 'Identifier')
    return node.property.name;
  return node.computed &&
    node.property.type === 'Literal' &&
    typeof node.property.value === 'string'
    ? node.property.value
    : null;
}
