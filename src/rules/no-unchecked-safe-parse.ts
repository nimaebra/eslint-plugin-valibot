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
import { getReferencedVariable } from '../utils/referenced-variable';

const SAFE_PARSE_NAMES = new Set(['safeParse', 'safeParseAsync']);

type Options = [];
type MessageIds = 'uncheckedOutput';
type ResultProperty = 'success' | 'output';

interface TrackedResult {
  declaration: TSESTree.VariableDeclarator;
  copiedFrom?: TrackedResult;
  writes: Record<ResultProperty, TSESTree.Node[]>;
}

interface ResultAccess {
  result: TrackedResult;
  at: TSESTree.Node;
}

interface FlowPoint {
  path: TSESLint.CodePath;
  segments: TSESLint.CodePathSegment[];
  order: number;
}

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
    const calls: { node: TSESTree.CallExpression; name: string }[] = [];
    const flow = new WeakMap<TSESTree.Node, FlowPoint>();
    const codePaths: {
      path: TSESLint.CodePath;
      segments: Set<TSESLint.CodePathSegment>;
    }[] = [];
    let order = 0;

    return {
      onCodePathStart(path: TSESLint.CodePath) {
        codePaths.push({ path, segments: new Set() });
      },
      onCodePathEnd() {
        codePaths.pop();
      },
      onCodePathSegmentStart(segment: TSESLint.CodePathSegment) {
        codePaths.at(-1)?.segments.add(segment);
      },
      onCodePathSegmentEnd(segment: TSESLint.CodePathSegment) {
        codePaths.at(-1)?.segments.delete(segment);
      },
      Program(node) {
        imports = collectValibotImports(node, context.sourceCode);
      },
      'Program:exit'() {
        for (const { node, name } of calls) checkCall(node, name);
      },
      'AssignmentExpression:exit': recordFlowPoint,
      'MemberExpression:exit': recordFlowPoint,
      'UnaryExpression:exit': recordFlowPoint,
      'UpdateExpression:exit': recordFlowPoint,
      'VariableDeclarator:exit': recordFlowPoint,
      CallExpression(node) {
        if (!hasValibotImports(imports)) return;
        const name = getValibotCallName(node, imports);
        if (name && SAFE_PARSE_NAMES.has(name)) calls.push({ node, name });
      },
    };

    function recordFlowPoint(node: TSESTree.Node): void {
      if (!hasValibotImports(imports)) return;
      const current = codePaths.at(-1);
      if (current?.segments.size) {
        flow.set(node, {
          path: current.path,
          segments: [...current.segments],
          order: order++,
        });
      }
    }

    function checkCall(node: TSESTree.CallExpression, name: string): void {
      // Un-awaited safeParseAsync() results are a promise; that mistake is
      // reported by no-unawaited-parse-async instead.
      const value = node.parent.type === 'AwaitExpression' ? node.parent : node;
      if (name === 'safeParseAsync' && value === node) return;

      const report = (reportNode: TSESTree.Node) =>
        context.report({
          node: reportNode,
          messageId: 'uncheckedOutput',
          data: { name },
        });

      const parent = value.parent;
      if (isOutputAccess(parent, value)) {
        if (isMemberRead(parent)) report(parent);
        return;
      }

      if (parent?.type !== 'VariableDeclarator' || parent.init !== value)
        return;

      const results = new Map<TSESLint.Scope.Variable, TrackedResult>();
      const successes = new Map<TSESLint.Scope.Variable, ResultAccess>();
      const reads: (ResultAccess & { node: TSESTree.Node })[] = [];
      const pending = [{ declaration: parent, result: trackResult(parent) }];
      const visited = new Set<TSESTree.VariableDeclarator>();

      while (pending.length) {
        const { declaration, result } = pending.pop()!;
        if (visited.has(declaration)) continue;
        visited.add(declaration);
        const variables = sourceCode
          .getDeclaredVariables(declaration)
          .filter(isStable);

        if (declaration.id.type === 'ObjectPattern') {
          const properties = declaration.id.properties;
          const output = properties.find(
            (property) =>
              property.type === 'Property' &&
              ASTUtils.getPropertyName(property) === 'output',
          );
          const success = properties.find(
            (property) =>
              property.type === 'Property' &&
              ASTUtils.getPropertyName(property) === 'success',
          );
          const rest = properties.find(
            (property) => property.type === 'RestElement',
          );
          if (output && !success && !rest) {
            reads.push({ node: output, at: declaration, result });
            continue;
          }
          for (const variable of variables) {
            const identifier = variable.identifiers[0];
            if (success?.type === 'Property' && success.value === identifier) {
              successes.set(variable, { result, at: declaration });
            }
            if (rest?.argument === identifier) {
              results.set(variable, trackResult(declaration, result));
            }
            if (output?.type === 'Property' && output.value === identifier) {
              for (const reference of variable.references) {
                if (reference.isRead()) {
                  reads.push({
                    node: reference.identifier,
                    at: declaration,
                    result,
                  });
                }
              }
            }
          }
          continue;
        }

        const [variable] = variables;
        if (declaration.id.type !== 'Identifier' || !variable) continue;
        results.set(variable, result);
        for (const reference of variable.references) {
          const identifier = reference.identifier;
          const member = identifier.parent;
          if (isOutputAccess(member, identifier) && isMemberRead(member)) {
            reads.push({ node: member, at: member, result });
          }
          if (
            member.type === 'VariableDeclarator' &&
            member.init === identifier
          ) {
            pending.push({ declaration: member, result });
          }
        }
      }

      for (const [variable, result] of results) {
        for (const { identifier } of variable.references) {
          const member = identifier.parent;
          if (
            member.type !== 'MemberExpression' ||
            member.object !== identifier
          )
            continue;
          const write = getMemberWrite(member);
          if (!write) continue;
          const property = ASTUtils.getPropertyName(member);
          if (property === null || property === 'success')
            result.writes.success.push(write);
          if (property === null || property === 'output')
            result.writes.output.push(write);
        }
      }

      const isSuccess: SuccessCheck = (expression) => {
        if (expression.type === 'Identifier') {
          const variable = getReferencedVariable(sourceCode, expression);
          const access = variable && successes.get(variable);
          return !!access && !hasWriteBefore(access, 'success');
        }
        if (
          expression.type !== 'MemberExpression' ||
          ASTUtils.getPropertyName(expression) !== 'success' ||
          expression.object.type !== 'Identifier'
        ) {
          return false;
        }
        const variable = getReferencedVariable(sourceCode, expression.object);
        const result = variable && results.get(variable);
        return (
          !!result && !hasWriteBefore({ result, at: expression }, 'success')
        );
      };

      for (const read of reads) {
        if (
          !isGuardedBySuccessCheck(read.node, isSuccess, sourceCode) ||
          hasWriteBefore(read, 'output')
        ) {
          report(read.node);
        }
      }
    }

    function hasWriteBefore(
      access: ResultAccess,
      property: ResultProperty,
    ): boolean {
      let at = access.at;
      for (
        let result: TrackedResult | undefined = access.result;
        result;
        result = result.copiedFrom
      ) {
        const reset = flow.get(result.declaration);
        const target = flow.get(at);
        if (
          result.writes[property].some((write) =>
            canReachBeforeReset(flow.get(write), target, reset),
          )
        ) {
          return true;
        }
        at = result.declaration;
      }
      return false;
    }
  },
});

function isStable(variable: TSESLint.Scope.Variable): boolean {
  return !variable.references.some(
    (reference) => reference.isWrite() && !reference.init,
  );
}

function trackResult(
  declaration: TSESTree.VariableDeclarator,
  copiedFrom?: TrackedResult,
): TrackedResult {
  return { declaration, copiedFrom, writes: { success: [], output: [] } };
}

function getMemberWrite(member: TSESTree.MemberExpression) {
  const parent = member.parent;
  return (parent.type === 'AssignmentExpression' && parent.left === member) ||
    parent.type === 'UpdateExpression' ||
    (parent.type === 'UnaryExpression' && parent.operator === 'delete')
    ? parent
    : null;
}

function isMemberRead(member: TSESTree.MemberExpression): boolean {
  const write = getMemberWrite(member);
  return (
    !write ||
    write.type === 'UpdateExpression' ||
    (write.type === 'AssignmentExpression' && write.operator !== '=')
  );
}

function canReachBeforeReset(
  from?: FlowPoint,
  to?: FlowPoint,
  reset?: FlowPoint,
): boolean {
  if (!from?.segments.length || !to?.segments.length) return false;
  // Calls can interleave across functions, and a captured result can survive
  // multiple calls to the same function.
  if (from.path !== to.path || reset?.path !== from.path) return true;

  const pending: TSESLint.CodePathSegment[] = [];
  for (const segment of from.segments) {
    const resetsAfterWrite =
      reset.segments.includes(segment) && from.order < reset.order;
    if (
      to.segments.includes(segment) &&
      from.order < to.order &&
      (!resetsAfterWrite || to.order <= reset.order)
    )
      return true;
    if (!resetsAfterWrite) pending.push(...segment.nextSegments);
  }

  const visited = new Set<TSESLint.CodePathSegment>();
  while (pending.length) {
    const segment = pending.pop()!;
    if (visited.has(segment)) continue;
    visited.add(segment);
    const resetsResult = reset.segments.includes(segment);
    if (
      to.segments.includes(segment) &&
      (!resetsResult || to.order <= reset.order)
    ) {
      return true;
    }
    // A loop that evaluates safeParse again starts with a fresh result.
    if (!resetsResult) pending.push(...segment.nextSegments);
  }
  return false;
}

function isOutputAccess(
  node: TSESTree.Node | undefined,
  object: TSESTree.Node,
): node is TSESTree.MemberExpression {
  return (
    node?.type === 'MemberExpression' &&
    node.object === object &&
    ASTUtils.getPropertyName(node) === 'output'
  );
}

function isGuardedBySuccessCheck(
  node: TSESTree.Node,
  isSuccess: SuccessCheck,
  sourceCode: Readonly<TSESLint.SourceCode>,
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
        if (
          hasPrecedingExitOnFailure(current.body, child, isSuccess, sourceCode)
        ) {
          return true;
        }
        break;

      case 'SwitchCase':
        if (
          hasPrecedingExitOnFailure(
            current.consequent,
            child,
            isSuccess,
            sourceCode,
          )
        ) {
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
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  const index = statements.indexOf(child);

  return statements
    .slice(0, Math.max(index, 0))
    .some(
      (statement) =>
        statement.type === 'IfStatement' &&
        ((alwaysExits(statement.consequent, sourceCode) &&
          falsyImpliesSuccess(statement.test, isSuccess)) ||
          (statement.alternate !== null &&
            alwaysExits(statement.alternate, sourceCode) &&
            truthyImpliesSuccess(statement.test, isSuccess))),
    );
}

function alwaysExits(
  statement: TSESTree.Statement,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  switch (statement.type) {
    case 'BreakStatement':
    case 'ContinueStatement':
    case 'ReturnStatement':
    case 'ThrowStatement':
      return true;
    case 'ExpressionStatement':
      return isNodeProcessExit(statement.expression, sourceCode);
    case 'BlockStatement': {
      const last = statement.body.at(-1);

      return last !== undefined && alwaysExits(last, sourceCode);
    }
    default:
      return false;
  }
}

function isNodeProcessExit(
  expression: TSESTree.Expression,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  if (expression.type !== 'CallExpression' || expression.optional) return false;
  const { callee } = expression;
  if (
    callee.type !== 'MemberExpression' ||
    callee.optional ||
    callee.object.type !== 'Identifier' ||
    ASTUtils.getPropertyName(callee) !== 'exit'
  ) {
    return false;
  }

  const variable = getReferencedVariable(sourceCode, callee.object);
  if (variable && !isStable(variable)) return false;
  const definition = variable?.defs[0];
  if (!definition) return callee.object.name === 'process';

  return (
    definition.type === 'ImportBinding' &&
    (definition.node.type === 'ImportDefaultSpecifier' ||
      definition.node.type === 'ImportNamespaceSpecifier') &&
    definition.parent.type === 'ImportDeclaration' &&
    definition.parent.importKind !== 'type' &&
    (definition.parent.source.value === 'node:process' ||
      definition.parent.source.value === 'process')
  );
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
