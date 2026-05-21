import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getSchemaBindingName } from '../utils/schema-identifiers';

type Options = [
  {
    exportedOnly?: boolean;
    suffix?: string;
  },
];
type MessageIds = 'schemaNameSuffix';

export const schemaNameSuffix = createRule<Options, MessageIds>({
  name: 'schema-name-suffix',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require schema variables to use a consistent suffix such as Schema.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          exportedOnly: {
            type: 'boolean',
          },
          suffix: {
            type: 'string',
            minLength: 1,
          },
        },
      },
    ],
    messages: {
      schemaNameSuffix: 'Rename this schema binding to end with {{suffix}}.',
    },
  },
  defaultOptions: [
    {
      exportedOnly: false,
      suffix: 'Schema',
    },
  ],
  create(context, [options]) {
    let imports = createEmptyValibotImports();
    const exportedOnly = options.exportedOnly ?? false;
    const suffix = options.suffix ?? 'Schema';

    return {
      Program(node) {
        imports = collectValibotImports(node);
      },
      VariableDeclarator(node) {
        if (!hasValibotImports(imports)) {
          return;
        }

        const bindingName = getSchemaBindingName(node, imports);

        if (
          !bindingName ||
          (exportedOnly && !isExportedVariableDeclarator(node)) ||
          bindingName.endsWith(suffix)
        ) {
          return;
        }

        context.report({
          node: node.id,
          messageId: 'schemaNameSuffix',
          data: {
            suffix,
          },
        });
      },
    };
  },
});

function isExportedVariableDeclarator(
  node: Parameters<typeof getSchemaBindingName>[0],
): boolean {
  return node.parent?.parent?.type === 'ExportNamedDeclaration';
}
