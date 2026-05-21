import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

const OBJECT_SCHEMA_NAMES = [
  'object',
  'strictObject',
  'looseObject',
  'objectWithRest',
] as const;

const WRAPPER_NAMES = ['optional', 'nullish'] as const;

type Options = [];
type MessageIds = 'missingDefault';

export const requireDefaultInOptionalPipe = createRule<Options, MessageIds>({
  name: 'require-default-in-optional-pipe',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a default when optional() or nullish() starts a pipe inside an object schema entry.',
    },
    schema: [],
    messages: {
      missingDefault:
        'Provide a default to {{wrapperName}}() when it starts a pipe inside an object schema entry so later pipe items still run for missing keys.',
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

        if (
          !isValibotCall(node, imports, 'pipe') ||
          node.arguments.length < 2
        ) {
          return;
        }

        const pipeHead = node.arguments[0];

        if (pipeHead?.type !== 'CallExpression') {
          return;
        }

        const wrapperName = getMissingDefaultWrapperName(pipeHead, imports);

        if (!wrapperName || !isObjectSchemaEntryPipe(node, imports)) {
          return;
        }

        context.report({
          node: pipeHead,
          messageId: 'missingDefault',
          data: {
            wrapperName,
          },
        });
      },
    };
  },
});

function getMissingDefaultWrapperName(
  call: Parameters<typeof isValibotCall>[0],
  imports: ValibotImports,
): (typeof WRAPPER_NAMES)[number] | null {
  if (call.arguments.length !== 1) {
    return null;
  }

  for (const wrapperName of WRAPPER_NAMES) {
    if (isValibotCall(call, imports, wrapperName)) {
      return wrapperName;
    }
  }

  return null;
}

function isObjectSchemaEntryPipe(
  pipeCall: Parameters<typeof isValibotCall>[0],
  imports: ValibotImports,
): boolean {
  const parent = pipeCall.parent;

  if (!parent || parent.type !== 'Property' || parent.value !== pipeCall) {
    return false;
  }

  const objectLiteral = parent.parent;

  if (!objectLiteral || objectLiteral.type !== 'ObjectExpression') {
    return false;
  }

  const schemaCall = objectLiteral.parent;

  if (!schemaCall || schemaCall.type !== 'CallExpression') {
    return false;
  }

  if (schemaCall.arguments[0] !== objectLiteral) {
    return false;
  }

  return OBJECT_SCHEMA_NAMES.some((schemaName) =>
    isValibotCall(schemaCall, imports, schemaName),
  );
}
