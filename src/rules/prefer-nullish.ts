import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

const WRAPPER_PAIRS = [
  ['optional', 'nullable'],
  ['nullable', 'optional'],
] as const;

type Options = [];
type MessageIds = 'preferNullish';

export const preferNullish = createRule<Options, MessageIds>({
  name: 'prefer-nullish',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer nullish() over nested optional() and nullable() wrappers.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferNullish:
        'Prefer nullish() instead of nesting optional() and nullable().',
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
        if (!hasValibotImports(imports) || node.arguments.length !== 1) {
          return;
        }

        const innerCall = node.arguments[0];

        if (
          innerCall?.type !== 'CallExpression' ||
          innerCall.arguments.length !== 1
        ) {
          return;
        }

        const innerSchema = innerCall.arguments[0];

        if (!innerSchema) {
          return;
        }

        const pair = getWrapperPair(node, innerCall, imports);

        if (!pair) {
          return;
        }

        const preferredCalleeText = getPreferredCalleeText(node, imports);

        context.report({
          node,
          messageId: 'preferNullish',
          fix: preferredCalleeText
            ? (fixer) =>
                fixer.replaceText(
                  node,
                  `${preferredCalleeText}(${sourceCode.getText(innerSchema)})`,
                )
            : null,
        });
      },
    };
  },
});

function getWrapperPair(
  outerCall: Parameters<typeof isValibotCall>[0],
  innerCall: Parameters<typeof isValibotCall>[0],
  imports: ValibotImports,
): (typeof WRAPPER_PAIRS)[number] | null {
  for (const pair of WRAPPER_PAIRS) {
    if (
      isValibotCall(outerCall, imports, pair[0]) &&
      isValibotCall(innerCall, imports, pair[1])
    ) {
      return pair;
    }
  }

  return null;
}

function getPreferredCalleeText(
  call: Parameters<typeof isValibotCall>[0],
  imports: ValibotImports,
): string | null {
  if (call.callee.type === 'MemberExpression') {
    return `${sourceTextForMemberNamespace(call)}.nullish`;
  }

  const localNullishName = getLocalImportName(imports, 'nullish');

  return localNullishName ?? null;
}

function sourceTextForMemberNamespace(
  call: Parameters<typeof isValibotCall>[0],
): string {
  if (
    call.callee.type === 'MemberExpression' &&
    call.callee.object.type === 'Identifier'
  ) {
    return call.callee.object.name;
  }

  return 'v';
}

function getLocalImportName(
  imports: ValibotImports,
  importedName: string,
): string | undefined {
  for (const [localName, importedValue] of imports.importedNames) {
    if (importedValue === importedName) {
      return localName;
    }
  }

  return undefined;
}
