import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';

const STYLES = ['namespace', 'named'] as const;

type Style = (typeof STYLES)[number];

type Options = [
  {
    namespaceAlias?: string;
    style?: Style;
  },
];
type MessageIds = 'namespaceAlias' | 'preferNamed' | 'preferNamespace';

interface ResolvedOptions {
  namespaceAlias: string;
  style: Style;
}

export const consistentImport = createRule<Options, MessageIds>({
  name: 'consistent-import',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a consistent Valibot import style using either namespace or named imports.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          namespaceAlias: {
            type: 'string',
            minLength: 1,
          },
          style: {
            type: 'string',
            enum: [...STYLES],
          },
        },
      },
    ],
    messages: {
      namespaceAlias:
        "Use '{{expectedAlias}}' as the namespace alias for Valibot imports.",
      preferNamed:
        "Use named Valibot imports like `import { object, string } from 'valibot'`.",
      preferNamespace:
        "Use a namespace Valibot import like `import * as {{namespaceAlias}} from 'valibot'`.",
    },
  },
  defaultOptions: [
    {
      namespaceAlias: 'v',
      style: 'namespace',
    },
  ],
  create(context, [options]) {
    const resolvedOptions = resolveOptions(options);

    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'valibot') {
          return;
        }

        if (resolvedOptions.style === 'namespace') {
          verifyNamespaceImport(context, node, resolvedOptions);
          return;
        }

        verifyNamedImport(context, node);
      },
    };
  },
});

function resolveOptions(options: Options[0] | undefined): ResolvedOptions {
  return {
    namespaceAlias: options?.namespaceAlias ?? 'v',
    style: options?.style ?? 'namespace',
  };
}

function verifyNamespaceImport(
  context: Parameters<typeof consistentImport.create>[0],
  node: TSESTree.ImportDeclaration,
  options: ResolvedOptions,
): void {
  const namespaceSpecifier = node.specifiers.find(
    (specifier): specifier is TSESTree.ImportNamespaceSpecifier =>
      specifier.type === 'ImportNamespaceSpecifier',
  );

  const hasOnlyNamespaceSpecifier =
    node.specifiers.length === 1 && Boolean(namespaceSpecifier);

  if (!namespaceSpecifier || !hasOnlyNamespaceSpecifier) {
    context.report({
      node,
      messageId: 'preferNamespace',
      data: {
        namespaceAlias: options.namespaceAlias,
      },
    });
    return;
  }

  if (namespaceSpecifier.local.name !== options.namespaceAlias) {
    context.report({
      node: namespaceSpecifier.local,
      messageId: 'namespaceAlias',
      data: {
        expectedAlias: options.namespaceAlias,
      },
    });
  }
}

function verifyNamedImport(
  context: Parameters<typeof consistentImport.create>[0],
  node: TSESTree.ImportDeclaration,
): void {
  const hasNamespaceSpecifier = node.specifiers.some(
    (specifier) => specifier.type === 'ImportNamespaceSpecifier',
  );
  const hasDefaultSpecifier = node.specifiers.some(
    (specifier) => specifier.type === 'ImportDefaultSpecifier',
  );
  const hasNamedSpecifiers = node.specifiers.some(
    (specifier) => specifier.type === 'ImportSpecifier',
  );

  if (!hasNamedSpecifiers || hasNamespaceSpecifier || hasDefaultSpecifier) {
    context.report({
      node,
      messageId: 'preferNamed',
    });
  }
}
