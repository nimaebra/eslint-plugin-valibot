import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
  type ValibotImports,
} from '../utils/collect-valibot-imports';
import { getSchemaBindingName } from '../utils/schema-identifiers';

const CONVENTIONS = ['same-name', 'suffix'] as const;
const SCOPES = ['exported', 'all'] as const;
const INFER_TYPE_NAMES: Readonly<Record<string, InferKind>> = {
  InferInput: 'input',
  InferOutput: 'output',
};

type Convention = (typeof CONVENTIONS)[number];
type InferKind = 'input' | 'output';
type Scope = (typeof SCOPES)[number];

type Options = [
  {
    allowDataSuffix?: boolean;
    convention?: Convention;
    dataSuffix?: string;
    inputSuffix?: string;
    outputSuffix?: string;
    schemaSuffix?: string;
    scope?: Scope;
  },
];
type MessageIds = 'schemaNameConvention' | 'typeNameConvention';

interface ConventionOptions {
  allowDataSuffix: boolean;
  convention: Convention;
  dataSuffix: string;
  inputSuffix: string;
  outputSuffix: string;
  schemaSuffix: string;
  scope: Scope;
}

interface SchemaBindingInfo {
  name: string;
  node: TSESTree.Identifier;
}

interface InferTypeAliasInfo {
  aliasName: string;
  inferKind: InferKind;
  node: TSESTree.Identifier;
  schemaName: string;
}

export const consistentSchemaConvention = createRule<Options, MessageIds>({
  name: 'consistent-schema-convention',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a consistent Valibot schema naming convention for exported schemas and inferred types.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowDataSuffix: {
            type: 'boolean',
          },
          convention: {
            type: 'string',
            enum: [...CONVENTIONS],
          },
          dataSuffix: {
            type: 'string',
            minLength: 1,
          },
          inputSuffix: {
            type: 'string',
            minLength: 1,
          },
          outputSuffix: {
            type: 'string',
            minLength: 1,
          },
          schemaSuffix: {
            type: 'string',
            minLength: 1,
          },
          scope: {
            type: 'string',
            enum: [...SCOPES],
          },
        },
      },
    ],
    messages: {
      schemaNameConvention:
        "Rename this schema binding to '{{expectedName}}' to follow the '{{convention}}' naming convention.",
      typeNameConvention:
        "Rename this inferred type alias to '{{expectedName}}' to follow the '{{convention}}' naming convention.",
    },
  },
  defaultOptions: [
    {
      allowDataSuffix: true,
      convention: 'suffix',
      dataSuffix: 'Data',
      inputSuffix: 'Input',
      outputSuffix: 'Output',
      schemaSuffix: 'Schema',
      scope: 'exported',
    },
  ],
  create(context, [options]) {
    let imports = createEmptyValibotImports();
    const exportedTypeBindings = new Set<string>();
    const exportedValueBindings = new Set<string>();
    const inferTypeAliases: InferTypeAliasInfo[] = [];
    const resolvedOptions = resolveOptions(options);
    const schemaBindings = new Map<string, SchemaBindingInfo>();

    return {
      Program(node) {
        imports = collectValibotImports(node);
        exportedTypeBindings.clear();
        exportedValueBindings.clear();
        inferTypeAliases.length = 0;
        schemaBindings.clear();
        collectExportedBindings(
          node,
          exportedValueBindings,
          exportedTypeBindings,
        );
      },
      VariableDeclarator(node) {
        if (!hasValibotImports(imports)) {
          return;
        }

        const bindingName = getSchemaBindingName(node, imports);

        if (
          !bindingName ||
          !shouldCheckSchemaBinding(
            node,
            resolvedOptions,
            exportedValueBindings,
          )
        ) {
          return;
        }

        if (node.id.type !== 'Identifier') {
          return;
        }

        schemaBindings.set(bindingName, {
          name: bindingName,
          node: node.id,
        });
      },
      TSTypeAliasDeclaration(node) {
        if (!hasValibotImports(imports)) {
          return;
        }

        const inferTypeAlias = getInferTypeAliasInfo(node, imports);

        if (
          !inferTypeAlias ||
          !shouldCheckTypeAlias(node, resolvedOptions, exportedTypeBindings)
        ) {
          return;
        }

        inferTypeAliases.push(inferTypeAlias);
      },
      'Program:exit'() {
        if (!hasValibotImports(imports)) {
          return;
        }

        for (const binding of schemaBindings.values()) {
          const expectedName = getExpectedSchemaName(
            binding.name,
            resolvedOptions,
          );

          if (binding.name === expectedName) {
            continue;
          }

          context.report({
            node: binding.node,
            messageId: 'schemaNameConvention',
            data: {
              convention: resolvedOptions.convention,
              expectedName,
            },
          });
        }

        for (const typeAlias of inferTypeAliases) {
          if (!schemaBindings.has(typeAlias.schemaName)) {
            continue;
          }

          const expectedName = getExpectedTypeAliasName(
            typeAlias.schemaName,
            typeAlias.inferKind,
            resolvedOptions,
          );

          if (
            typeAlias.aliasName === expectedName ||
            isAllowedDataAliasName(
              typeAlias.aliasName,
              typeAlias.schemaName,
              resolvedOptions,
            )
          ) {
            continue;
          }

          context.report({
            node: typeAlias.node,
            messageId: 'typeNameConvention',
            data: {
              convention: resolvedOptions.convention,
              expectedName,
            },
          });
        }
      },
    };
  },
});

function resolveOptions(options: Options[0] | undefined): ConventionOptions {
  return {
    allowDataSuffix: options?.allowDataSuffix ?? true,
    convention: options?.convention ?? 'suffix',
    dataSuffix: options?.dataSuffix ?? 'Data',
    inputSuffix: options?.inputSuffix ?? 'Input',
    outputSuffix: options?.outputSuffix ?? 'Output',
    schemaSuffix: options?.schemaSuffix ?? 'Schema',
    scope: options?.scope ?? 'exported',
  };
}

function collectExportedBindings(
  program: TSESTree.Program,
  exportedValueBindings: Set<string>,
  exportedTypeBindings: Set<string>,
): void {
  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      if (statement.declaration.type === 'Identifier') {
        exportedValueBindings.add(statement.declaration.name);
      }

      continue;
    }

    if (statement.type !== 'ExportNamedDeclaration') {
      continue;
    }

    if (statement.declaration) {
      collectExportedDeclarationBindings(
        statement.declaration,
        exportedValueBindings,
        exportedTypeBindings,
      );
    }

    for (const specifier of statement.specifiers) {
      if (specifier.local.type !== 'Identifier') {
        continue;
      }

      if (statement.exportKind === 'type' || specifier.exportKind === 'type') {
        exportedTypeBindings.add(specifier.local.name);
        continue;
      }

      exportedValueBindings.add(specifier.local.name);
    }
  }
}

function collectExportedDeclarationBindings(
  declaration: TSESTree.ExportNamedDeclaration['declaration'],
  exportedValueBindings: Set<string>,
  exportedTypeBindings: Set<string>,
): void {
  if (!declaration) {
    return;
  }

  if (declaration.type === 'VariableDeclaration') {
    for (const declarator of declaration.declarations) {
      if (declarator.id.type === 'Identifier') {
        exportedValueBindings.add(declarator.id.name);
      }
    }

    return;
  }

  if (declaration.type === 'TSTypeAliasDeclaration') {
    exportedTypeBindings.add(declaration.id.name);
  }
}

function shouldCheckSchemaBinding(
  node: TSESTree.VariableDeclarator,
  options: ConventionOptions,
  exportedValueBindings: Set<string>,
): boolean {
  return (
    options.scope === 'all' ||
    isInlineExportedVariableDeclarator(node) ||
    (node.id.type === 'Identifier' && exportedValueBindings.has(node.id.name))
  );
}

function shouldCheckTypeAlias(
  node: TSESTree.TSTypeAliasDeclaration,
  options: ConventionOptions,
  exportedTypeBindings: Set<string>,
): boolean {
  return (
    options.scope === 'all' ||
    isInlineExportedTypeAlias(node) ||
    exportedTypeBindings.has(node.id.name)
  );
}

function isInlineExportedVariableDeclarator(
  node: TSESTree.VariableDeclarator,
): boolean {
  return node.parent?.parent?.type === 'ExportNamedDeclaration';
}

function isInlineExportedTypeAlias(
  node: TSESTree.TSTypeAliasDeclaration,
): boolean {
  return node.parent?.type === 'ExportNamedDeclaration';
}

function getInferTypeAliasInfo(
  node: TSESTree.TSTypeAliasDeclaration,
  imports: ValibotImports,
): InferTypeAliasInfo | null {
  if (node.typeAnnotation.type !== 'TSTypeReference') {
    return null;
  }

  const inferKind = getInferTypeKind(node.typeAnnotation, imports);
  const typeParameter = node.typeAnnotation.typeArguments?.params[0];
  const schemaName = typeParameter && getSchemaNameFromTypeQuery(typeParameter);

  if (!inferKind || !schemaName) {
    return null;
  }

  return {
    aliasName: node.id.name,
    inferKind,
    node: node.id,
    schemaName,
  };
}

function getInferTypeKind(
  node: TSESTree.TSTypeReference,
  imports: ValibotImports,
): InferKind | null {
  if (node.typeName.type === 'Identifier') {
    return (
      INFER_TYPE_NAMES[imports.importedNames.get(node.typeName.name) ?? ''] ??
      null
    );
  }

  if (node.typeName.type !== 'TSQualifiedName') {
    return null;
  }

  return node.typeName.left.type === 'Identifier' &&
    imports.namespaces.has(node.typeName.left.name)
    ? (INFER_TYPE_NAMES[node.typeName.right.name] ?? null)
    : null;
}

function getSchemaNameFromTypeQuery(node: TSESTree.TypeNode): string | null {
  return node.type === 'TSTypeQuery' && node.exprName.type === 'Identifier'
    ? node.exprName.name
    : null;
}

function getExpectedSchemaName(
  actualName: string,
  options: ConventionOptions,
): string {
  const baseName = getNormalizedBaseName(actualName, options);

  return options.convention === 'same-name'
    ? baseName
    : `${baseName}${options.schemaSuffix}`;
}

function getExpectedTypeAliasName(
  schemaName: string,
  inferKind: InferKind,
  options: ConventionOptions,
): string {
  const baseName = getNormalizedBaseName(schemaName, options);

  if (options.convention === 'same-name') {
    return baseName;
  }

  return `${baseName}${
    inferKind === 'input' ? options.inputSuffix : options.outputSuffix
  }`;
}

function isAllowedDataAliasName(
  aliasName: string,
  schemaName: string,
  options: ConventionOptions,
): boolean {
  return (
    options.convention === 'suffix' &&
    options.allowDataSuffix &&
    aliasName ===
      `${getNormalizedBaseName(schemaName, options)}${options.dataSuffix}`
  );
}

function getNormalizedBaseName(
  value: string,
  options: ConventionOptions,
): string {
  const strippedValue = stripKnownSuffix(value, options);

  return isPascalCaseLike(strippedValue)
    ? strippedValue
    : toPascalCase(strippedValue);
}

function stripKnownSuffix(value: string, options: ConventionOptions): string {
  const suffixes = [
    options.schemaSuffix,
    options.inputSuffix,
    options.outputSuffix,
    ...(options.allowDataSuffix ? [options.dataSuffix] : []),
  ].sort((left, right) => right.length - left.length);

  for (const suffix of suffixes) {
    if (value.endsWith(suffix) && value.length > suffix.length) {
      return value.slice(0, -suffix.length);
    }
  }

  return value;
}

function isPascalCaseLike(value: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/.test(value);
}

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join('');
}
