import { ASTUtils, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { SCHEMA_CALL_NAMES } from '../utils/is-schema-expression';
import { getValibotCallName } from '../utils/is-valibot-call';

/**
 * Where a sync API receives schemas:
 * - `entries`: values of the object literal in argument 0
 * - `argN`: argument N
 * - `itemsN`: elements of the array literal in argument N
 * - `getter`: the value returned by the arrow function in argument 0
 */
type SchemaSlot = 'arg0' | 'arg1' | 'entries' | 'getter' | 'items0' | 'items1';

/**
 * Sync Valibot APIs that cannot run async schemas. Each one except `assert()`
 * and `is()` has an `Async` twin. Generic helpers such as `pick()`, `omit()`,
 * `config()` and `message()` are excluded because they accept async schemas.
 */
export const SYNC_SCHEMA_PARENTS = new Map<string, SchemaSlot[]>([
  ['array', ['arg0']],
  ['assert', ['arg0']],
  ['cache', ['arg0']],
  ['exactOptional', ['arg0']],
  ['fallback', ['arg0']],
  ['intersect', ['items0']],
  ['is', ['arg0']],
  ['lazy', ['getter']],
  ['looseObject', ['entries']],
  ['looseTuple', ['items0']],
  ['map', ['arg0', 'arg1']],
  ['nonNullable', ['arg0']],
  ['nonNullish', ['arg0']],
  ['nonOptional', ['arg0']],
  ['nullable', ['arg0']],
  ['nullish', ['arg0']],
  ['object', ['entries']],
  ['objectWithRest', ['entries', 'arg1']],
  ['optional', ['arg0']],
  ['parse', ['arg0']],
  ['parser', ['arg0']],
  ['partial', ['arg0']],
  ['pipe', ['arg0']],
  ['record', ['arg0', 'arg1']],
  ['required', ['arg0']],
  ['safeParse', ['arg0']],
  ['safeParser', ['arg0']],
  ['set', ['arg0']],
  ['strictObject', ['entries']],
  ['strictTuple', ['items0']],
  ['tuple', ['items0']],
  ['tupleWithRest', ['items0', 'arg1']],
  ['undefinedable', ['arg0']],
  ['union', ['items0']],
  ['variant', ['items1']],
]);

const PARENTS_WITHOUT_ASYNC_TWIN = new Set(['assert', 'is']);

const ASYNC_SUFFIX = 'Async';

type Options = [];
type MessageIds = 'asyncSchemaInSyncParent' | 'asyncSchemaWithoutAsyncTwin';

export const noAsyncSchemaInSyncParent = createRule<Options, MessageIds>({
  name: 'no-async-schema-in-sync-parent',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow passing async Valibot schemas to sync schemas and parse functions, which skip their validation.',
    },
    schema: [],
    messages: {
      asyncSchemaInSyncParent:
        '{{parent}}() is synchronous and cannot run the async schema {{child}}, so its validation is skipped. Use {{parent}}Async() instead.',
      asyncSchemaWithoutAsyncTwin:
        '{{parent}}() is synchronous and cannot run the async schema {{child}}, so its validation is skipped. Use parseAsync() or safeParseAsync() instead.',
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

        const parent = getValibotCallName(node, imports);
        const slots = parent ? SYNC_SCHEMA_PARENTS.get(parent) : undefined;

        if (!parent || !slots) {
          return;
        }

        for (const child of slots.flatMap((slot) => getSlotNodes(node, slot))) {
          const asyncSchemaName = getAsyncSchemaName(child, imports);

          if (!asyncSchemaName) {
            continue;
          }

          context.report({
            node: child,
            messageId: PARENTS_WITHOUT_ASYNC_TWIN.has(parent)
              ? 'asyncSchemaWithoutAsyncTwin'
              : 'asyncSchemaInSyncParent',
            data: {
              parent,
              child:
                child.type === 'Identifier'
                  ? `${child.name} (${asyncSchemaName}())`
                  : `${asyncSchemaName}()`,
            },
          });
        }
      },
    };

    /**
     * Returns the async schema API name when `node` is an async schema call,
     * or a `const` binding initialized with one.
     */
    function getAsyncSchemaName(
      node: TSESTree.Node,
      valibotImports: ValibotImports,
      visited = new Set<TSESTree.Node>(),
    ): string | null {
      if (visited.has(node)) {
        return null;
      }

      visited.add(node);

      if (node.type === 'CallExpression') {
        const name = getValibotCallName(node, valibotImports);

        return name?.endsWith(ASYNC_SUFFIX) &&
          SCHEMA_CALL_NAMES.has(name.slice(0, -ASYNC_SUFFIX.length))
          ? name
          : null;
      }

      if (node.type !== 'Identifier') {
        return null;
      }

      const variable = ASTUtils.findVariable(
        sourceCode.getScope(node),
        node.name,
      );
      const definition = variable?.defs.length === 1 ? variable.defs[0] : null;

      if (
        definition?.node.type !== 'VariableDeclarator' ||
        definition.parent?.type !== 'VariableDeclaration' ||
        definition.parent.kind !== 'const' ||
        !definition.node.init
      ) {
        return null;
      }

      return getAsyncSchemaName(definition.node.init, valibotImports, visited);
    }
  },
});

function getSlotNodes(
  call: TSESTree.CallExpression,
  slot: SchemaSlot,
): TSESTree.Node[] {
  switch (slot) {
    case 'arg0':
    case 'arg1': {
      const argument = call.arguments[slot === 'arg0' ? 0 : 1];

      return argument && argument.type !== 'SpreadElement' ? [argument] : [];
    }

    case 'items0':
    case 'items1': {
      const argument = call.arguments[slot === 'items0' ? 0 : 1];

      return argument?.type === 'ArrayExpression'
        ? argument.elements.filter(
            (element): element is TSESTree.Expression =>
              element !== null && element.type !== 'SpreadElement',
          )
        : [];
    }

    case 'entries': {
      const argument = call.arguments[0];

      return argument?.type === 'ObjectExpression'
        ? argument.properties.flatMap((property) =>
            property.type === 'Property' ? [property.value] : [],
          )
        : [];
    }

    case 'getter': {
      const argument = call.arguments[0];

      return argument?.type === 'ArrowFunctionExpression' &&
        argument.body.type !== 'BlockStatement'
        ? [argument.body]
        : [];
    }
  }
}
