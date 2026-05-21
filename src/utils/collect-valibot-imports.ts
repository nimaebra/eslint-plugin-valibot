import type { TSESTree } from '@typescript-eslint/utils';

const VALIBOT_MODULE_NAME = 'valibot';

export interface ValibotImports {
  namespaces: Set<string>;
  importedNames: Map<string, string>;
}

export function createEmptyValibotImports(): ValibotImports {
  return {
    namespaces: new Set<string>(),
    importedNames: new Map<string, string>(),
  };
}

export function hasValibotImports(imports: ValibotImports): boolean {
  return imports.namespaces.size > 0 || imports.importedNames.size > 0;
}

export function collectValibotImports(
  program: TSESTree.Program,
): ValibotImports {
  const imports = createEmptyValibotImports();

  for (const statement of program.body) {
    if (
      statement.type === 'ImportDeclaration' &&
      statement.source.value === VALIBOT_MODULE_NAME
    ) {
      for (const specifier of statement.specifiers) {
        if (specifier.type === 'ImportNamespaceSpecifier') {
          imports.namespaces.add(specifier.local.name);
          continue;
        }

        if (specifier.type === 'ImportSpecifier') {
          const importedName =
            specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : String(specifier.imported.value);

          imports.importedNames.set(specifier.local.name, importedName);
        }
      }

      continue;
    }

    if (statement.type !== 'VariableDeclaration') {
      continue;
    }

    for (const declaration of statement.declarations) {
      if (!declaration.init || declaration.init.type !== 'CallExpression') {
        continue;
      }

      if (!isRequireFromValibot(declaration.init)) {
        continue;
      }

      if (declaration.id.type === 'Identifier') {
        imports.namespaces.add(declaration.id.name);
        continue;
      }

      if (declaration.id.type !== 'ObjectPattern') {
        continue;
      }

      for (const property of declaration.id.properties) {
        if (property.type !== 'Property') {
          continue;
        }

        if (property.key.type !== 'Identifier') {
          continue;
        }

        if (property.value.type !== 'Identifier') {
          continue;
        }

        imports.importedNames.set(property.value.name, property.key.name);
      }
    }
  }

  return imports;
}

function isRequireFromValibot(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0]?.type === 'Literal' &&
    node.arguments[0].value === VALIBOT_MODULE_NAME
  );
}
