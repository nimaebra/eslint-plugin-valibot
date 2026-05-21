import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

type SafeParseProperty = 'output' | 'issues';
type GuardKind = 'success' | 'failure';
interface GuardGuarantees {
  whenTrue: GuardKind | null;
  whenFalse: GuardKind | null;
}
type Options = [];
type MessageIds = 'missingSuccessCheck';

export const requireSafeParseSuccessCheck = createRule<Options, MessageIds>({
  name: 'require-safe-parse-success-check',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require checking result.success before reading output or issues from a Valibot safeParse() result.',
    },
    schema: [],
    messages: {
      missingSuccessCheck:
        'Check safeParse().success before reading {{propertyName}} from the safeParse result.',
    },
  },
  defaultOptions: [],
  create(context) {
    let imports = createEmptyValibotImports();
    const safeParseBindings = new Set<string>();

    return {
      Program(node) {
        imports = collectValibotImports(node);
        safeParseBindings.clear();
      },
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') {
          updateSafeParseBinding(
            safeParseBindings,
            imports,
            node.id.name,
            node.init,
          );

          return;
        }

        if (node.id.type !== 'ObjectPattern') {
          return;
        }

        const safeParseSource = getSafeParseSource(
          node.init,
          imports,
          safeParseBindings,
        );

        if (!safeParseSource) {
          return;
        }

        for (const property of getDestructuredSafeParseProperties(node.id)) {
          if (
            safeParseSource.kind === 'binding' &&
            isNodeGuarded(node, safeParseSource.name, property.propertyName)
          ) {
            continue;
          }

          context.report({
            node: property.node,
            messageId: 'missingSuccessCheck',
            data: {
              propertyName: property.propertyName,
            },
          });
        }
      },
      AssignmentExpression(node) {
        if (node.left.type !== 'Identifier') {
          return;
        }

        updateSafeParseBinding(
          safeParseBindings,
          imports,
          node.left.name,
          node.right,
        );
      },
      MemberExpression(node) {
        if (!hasValibotImports(imports)) {
          return;
        }

        const propertyName = getSafeParseProperty(node);

        if (!propertyName) {
          return;
        }

        if (
          node.object.type === 'Identifier' &&
          safeParseBindings.has(node.object.name)
        ) {
          if (isNodeGuarded(node, node.object.name, propertyName)) {
            return;
          }

          context.report({
            node,
            messageId: 'missingSuccessCheck',
            data: {
              propertyName,
            },
          });

          return;
        }

        if (
          node.object.type === 'CallExpression' &&
          isValibotCall(node.object, imports, 'safeParse')
        ) {
          context.report({
            node,
            messageId: 'missingSuccessCheck',
            data: {
              propertyName,
            },
          });
        }
      },
    };
  },
});

function getSafeParseSource(
  initializer: TSESTree.Expression | null | undefined,
  imports: ValibotImports,
  bindings: Set<string>,
): { kind: 'binding'; name: string } | { kind: 'direct' } | null {
  if (!initializer) {
    return null;
  }

  if (initializer.type === 'Identifier' && bindings.has(initializer.name)) {
    return {
      kind: 'binding',
      name: initializer.name,
    };
  }

  if (
    initializer.type === 'CallExpression' &&
    isValibotCall(initializer, imports, 'safeParse')
  ) {
    return {
      kind: 'direct',
    };
  }

  return null;
}

function getDestructuredSafeParseProperties(
  pattern: TSESTree.ObjectPattern,
): Array<{ node: TSESTree.Node; propertyName: SafeParseProperty }> {
  const properties: Array<{
    node: TSESTree.Node;
    propertyName: SafeParseProperty;
  }> = [];

  for (const property of pattern.properties) {
    if (
      property.type !== 'Property' ||
      property.computed ||
      property.key.type !== 'Identifier'
    ) {
      continue;
    }

    if (property.key.name === 'output' || property.key.name === 'issues') {
      properties.push({
        node: property.key,
        propertyName: property.key.name,
      });
    }
  }

  return properties;
}

function updateSafeParseBinding(
  bindings: Set<string>,
  imports: ValibotImports,
  name: string,
  initializer: TSESTree.Expression | null | undefined,
): void {
  if (
    initializer?.type === 'CallExpression' &&
    isValibotCall(initializer, imports, 'safeParse')
  ) {
    bindings.add(name);
    return;
  }

  bindings.delete(name);
}

function getSafeParseProperty(
  node: TSESTree.MemberExpression,
): SafeParseProperty | null {
  if (node.computed || node.property.type !== 'Identifier') {
    return null;
  }

  if (node.property.name === 'output' || node.property.name === 'issues') {
    return node.property.name;
  }

  return null;
}

function isNodeGuarded(
  node: TSESTree.Node,
  resultName: string,
  propertyName: SafeParseProperty,
): boolean {
  let current: TSESTree.Node | undefined = node;

  while (current?.parent) {
    const parent: TSESTree.Node = current.parent;

    if (parent.type === 'IfStatement') {
      const branchKind = getIfBranchKind(current, parent);
      const guarantees = getGuardGuarantees(parent.test, resultName);

      if (
        branchKind &&
        branchAllowsProperty(branchKind, guarantees, propertyName)
      ) {
        return true;
      }
    }

    if (parent.type === 'ConditionalExpression') {
      const branchKind = getConditionalBranchKind(current, parent);
      const guarantees = getGuardGuarantees(parent.test, resultName);

      if (
        branchKind &&
        branchAllowsProperty(branchKind, guarantees, propertyName)
      ) {
        return true;
      }
    }

    if (parent.type === 'LogicalExpression') {
      const branchKind = getLogicalBranchKind(current, parent);

      if (branchKind === 'right') {
        const guarantees = getGuardGuarantees(parent.left, resultName);

        if (
          logicalRightAllowsProperty(parent.operator, guarantees, propertyName)
        ) {
          return true;
        }
      }
    }

    if (parent.type === 'SwitchCase') {
      const guardKind = getSwitchCaseGuardKind(parent, resultName);

      if (guardKind && propertyMatchesGuard(propertyName, guardKind)) {
        return true;
      }
    }

    current = parent;
  }

  return false;
}

function getGuardGuarantees(
  node: TSESTree.Node,
  resultName: string,
): GuardGuarantees {
  if (isSuccessMember(node, resultName)) {
    return {
      whenTrue: 'success',
      whenFalse: 'failure',
    };
  }

  if (node.type === 'UnaryExpression' && node.operator === '!') {
    return invertGuardGuarantees(getGuardGuarantees(node.argument, resultName));
  }

  if (node.type === 'BinaryExpression') {
    return getBinaryGuardGuarantees(node, resultName);
  }

  if (node.type === 'LogicalExpression') {
    return getLogicalGuardGuarantees(node, resultName);
  }

  return {
    whenTrue: null,
    whenFalse: null,
  };
}

function isSuccessMember(node: TSESTree.Node, resultName: string): boolean {
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object.type === 'Identifier' &&
    node.object.name === resultName &&
    node.property.type === 'Identifier' &&
    node.property.name === 'success'
  );
}

function branchAllowsProperty(
  branchKind: 'consequent' | 'alternate',
  guarantees: GuardGuarantees,
  propertyName: SafeParseProperty,
): boolean {
  const effectiveGuard =
    branchKind === 'consequent' ? guarantees.whenTrue : guarantees.whenFalse;

  return (
    effectiveGuard !== null &&
    propertyMatchesGuard(propertyName, effectiveGuard)
  );
}

function logicalRightAllowsProperty(
  operator: '&&' | '||' | '??',
  guarantees: GuardGuarantees,
  propertyName: SafeParseProperty,
): boolean {
  if (operator === '??') {
    return false;
  }

  const effectiveGuard =
    operator === '&&' ? guarantees.whenTrue : guarantees.whenFalse;

  return (
    effectiveGuard !== null &&
    propertyMatchesGuard(propertyName, effectiveGuard)
  );
}

function propertyMatchesGuard(
  propertyName: SafeParseProperty,
  guardKind: GuardKind,
): boolean {
  return (
    (propertyName === 'output' && guardKind === 'success') ||
    (propertyName === 'issues' && guardKind === 'failure')
  );
}

function invertGuardGuarantees(guarantees: GuardGuarantees): GuardGuarantees {
  return {
    whenTrue: guarantees.whenFalse,
    whenFalse: guarantees.whenTrue,
  };
}

function getBinaryGuardGuarantees(
  node: TSESTree.BinaryExpression,
  resultName: string,
): GuardGuarantees {
  if (
    node.operator !== '==' &&
    node.operator !== '===' &&
    node.operator !== '!=' &&
    node.operator !== '!=='
  ) {
    return {
      whenTrue: null,
      whenFalse: null,
    };
  }

  const leftBoolean = getBooleanLiteral(node.left);
  const rightBoolean = getBooleanLiteral(node.right);

  if (isSuccessMember(node.left, resultName) && rightBoolean !== null) {
    return getEqualityGuardGuarantees(node.operator, rightBoolean);
  }

  if (isSuccessMember(node.right, resultName) && leftBoolean !== null) {
    return getEqualityGuardGuarantees(node.operator, leftBoolean);
  }

  return {
    whenTrue: null,
    whenFalse: null,
  };
}

function getLogicalGuardGuarantees(
  node: TSESTree.LogicalExpression,
  resultName: string,
): GuardGuarantees {
  const left = getGuardGuarantees(node.left, resultName);
  const right = getGuardGuarantees(node.right, resultName);

  if (node.operator === '&&') {
    return {
      whenTrue: combineGuardKinds(left.whenTrue, right.whenTrue),
      whenFalse: null,
    };
  }

  if (node.operator === '||') {
    return {
      whenTrue: null,
      whenFalse: combineGuardKinds(left.whenFalse, right.whenFalse),
    };
  }

  return {
    whenTrue: null,
    whenFalse: null,
  };
}

function getEqualityGuardGuarantees(
  operator: '==' | '===' | '!=' | '!==',
  booleanValue: boolean,
): GuardGuarantees {
  const equalGuarantees: GuardGuarantees = booleanValue
    ? {
        whenTrue: 'success',
        whenFalse: 'failure',
      }
    : {
        whenTrue: 'failure',
        whenFalse: 'success',
      };

  if (operator === '==' || operator === '===') {
    return equalGuarantees;
  }

  return invertGuardGuarantees(equalGuarantees);
}

function combineGuardKinds(
  left: GuardKind | null,
  right: GuardKind | null,
): GuardKind | null {
  if (left === null) {
    return right;
  }

  if (right === null) {
    return left;
  }

  return left === right ? left : null;
}

function getBooleanLiteral(node: TSESTree.Node): boolean | null {
  return node.type === 'Literal' && typeof node.value === 'boolean'
    ? node.value
    : null;
}

function getSwitchCaseGuardKind(
  switchCase: TSESTree.SwitchCase,
  resultName: string,
): GuardKind | null {
  const switchStatement = switchCase.parent;

  if (switchStatement?.type !== 'SwitchStatement' || switchCase.test === null) {
    return null;
  }

  const caseValue = getBooleanLiteral(switchCase.test);

  if (caseValue === null) {
    return null;
  }

  const guarantees = getGuardGuarantees(
    switchStatement.discriminant,
    resultName,
  );

  return caseValue ? guarantees.whenTrue : guarantees.whenFalse;
}

function getIfBranchKind(
  current: TSESTree.Node,
  parent: TSESTree.IfStatement,
): 'consequent' | 'alternate' | null {
  if (parent.consequent === current) {
    return 'consequent';
  }

  if (parent.alternate === current) {
    return 'alternate';
  }

  return null;
}

function getConditionalBranchKind(
  current: TSESTree.Node,
  parent: TSESTree.ConditionalExpression,
): 'consequent' | 'alternate' | null {
  if (parent.consequent === current) {
    return 'consequent';
  }

  if (parent.alternate === current) {
    return 'alternate';
  }

  return null;
}

function getLogicalBranchKind(
  current: TSESTree.Node,
  parent: TSESTree.LogicalExpression,
): 'right' | null {
  if (parent.right === current) {
    return 'right';
  }

  return null;
}
