import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { isValibotCall } from '../utils/is-valibot-call';

const BUILTIN_CONSTRUCTORS = new Map<string, string>([
  ['Date', 'date'],
  ['Array', 'array'],
  ['Function', 'function'],
  ['Promise', 'promise'],
  ['Map', 'map'],
  ['Set', 'set'],
  ['String', 'string'],
  ['Number', 'number'],
  ['Boolean', 'boolean'],
  ['Symbol', 'symbol'],
  ['BigInt', 'bigint'],
  ['Blob', 'blob'],
]);

type Options = [];
type MessageIds = 'noInstanceofBuiltins';

export const noInstanceofBuiltins = createRule<Options, MessageIds>({
  name: 'no-instanceof-builtins',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer primitive schema functions over instance(Constructor) for built-in types.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noInstanceofBuiltins:
        'Prefer the native Valibot schema {{preferred}}() instead of instance({{constructor}}).',
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

        if (!isValibotCall(node, imports, 'instance') || node.arguments.length !== 1) {
          return;
        }

        const arg = node.arguments[0];

        if (arg.type !== 'Identifier') {
          return;
        }

        const constructorName = arg.name;
        const preferredSchema = BUILTIN_CONSTRUCTORS.get(constructorName);

        if (!preferredSchema) {
          return;
        }

        const preferredCalleeText = getPreferredCalleeText(node, preferredSchema, imports);

        context.report({
          node,
          messageId: 'noInstanceofBuiltins',
          data: {
            preferred: preferredSchema,
            constructor: constructorName,
          },
          fix(fixer) {
            return fixer.replaceText(node, `${preferredCalleeText}()`);
          },
        });
      },
    };
  },
});

function getPreferredCalleeText(
  call: Parameters<typeof isValibotCall>[0],
  targetName: string,
  imports: ValibotImports,
): string {
  if (call.callee.type === 'MemberExpression') {
    return `${sourceTextForMemberNamespace(call)}.${targetName}`;
  }

  const localName = getLocalImportName(imports, targetName);
  return localName ?? targetName;
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
