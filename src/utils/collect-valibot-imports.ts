import {
  ASTUtils,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';

// npm publishes `valibot`; JSR publishes `@valibot/valibot`. Deno also allows
// `npm:` and `jsr:` specifiers with an optional version, e.g.
// `jsr:@valibot/valibot@^1.5.0`.
const VALIBOT_PACKAGE_NAMES = new Set(['valibot', '@valibot/valibot']);
const VALIBOT_SPECIFIER_PATTERN = /^(?:(?:npm|jsr):)?(@?[^@]+)(?:@[^/]*)?$/;

export function isValibotModuleSource(source: unknown): boolean {
  if (typeof source !== 'string') {
    return false;
  }

  const packageName = VALIBOT_SPECIFIER_PATTERN.exec(source)?.[1];

  return packageName !== undefined && VALIBOT_PACKAGE_NAMES.has(packageName);
}

export interface ValibotImports {
  namespaces: Set<string>;
  importedNames: Map<string, string>;
  bindings: Map<string, { identifier: TSESTree.Identifier; typeOnly: boolean }>;
  sourceCode?: Readonly<TSESLint.SourceCode>;
  resolvedBindings: WeakMap<object, Map<string, boolean>>;
}

const importsCache = new WeakMap<
  Readonly<TSESLint.SourceCode>,
  ValibotImports
>();

export function createEmptyValibotImports(): ValibotImports {
  return {
    namespaces: new Set<string>(),
    importedNames: new Map<string, string>(),
    bindings: new Map(),
    resolvedBindings: new WeakMap(),
  };
}

export function hasValibotImports(imports: ValibotImports): boolean {
  return imports.namespaces.size > 0 || imports.importedNames.size > 0;
}

export function collectValibotImports(
  program: TSESTree.Program,
  sourceCode?: Readonly<TSESLint.SourceCode>,
): ValibotImports {
  const cached = sourceCode && importsCache.get(sourceCode);
  if (cached) return cached;
  const imports = createEmptyValibotImports();
  imports.sourceCode = sourceCode;
  if (sourceCode) importsCache.set(sourceCode, imports);

  for (const statement of program.body) {
    if (
      statement.type === 'ImportDeclaration' &&
      isValibotModuleSource(statement.source.value)
    ) {
      for (const specifier of statement.specifiers) {
        if (specifier.type === 'ImportDefaultSpecifier') continue;
        imports.bindings.set(specifier.local.name, {
          identifier: specifier.local,
          typeOnly:
            statement.importKind === 'type' ||
            (specifier.type === 'ImportSpecifier' &&
              specifier.importKind === 'type'),
        });
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

      if (sourceCode) {
        const requireVariable = ASTUtils.findVariable(
          sourceCode.getScope(declaration.init),
          'require',
        );
        if (requireVariable?.defs.length) continue;
      }

      if (declaration.id.type === 'Identifier') {
        imports.namespaces.add(declaration.id.name);
        imports.bindings.set(declaration.id.name, {
          identifier: declaration.id,
          typeOnly: false,
        });
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
        imports.bindings.set(property.value.name, {
          identifier: property.value,
          typeOnly: false,
        });
      }
    }
  }

  return imports;
}

/** Check the actual reference, including replacement names used by fixers. */
export function isValibotBinding(
  node: TSESTree.Node,
  imports: ValibotImports,
  name: string,
  allowTypeOnly = false,
): boolean {
  const binding = imports.bindings.get(name);
  if (!binding || (!allowTypeOnly && binding.typeOnly)) return false;
  const { sourceCode } = imports;
  // AST-only consumers can collect names without a scope manager.
  if (!sourceCode) return true;
  const scope = sourceCode.getScope(node);
  let cached = imports.resolvedBindings.get(scope);
  if (!cached) {
    cached = new Map();
    imports.resolvedBindings.set(scope, cached);
  }
  const known = cached.get(name);
  if (known !== undefined) return known;
  const variable = ASTUtils.findVariable(scope, name);
  const matches = Boolean(
    variable?.identifiers.includes(binding.identifier) &&
    !variable.references.some(
      (reference) => reference.isWrite() && !reference.init,
    ),
  );
  cached.set(name, matches);
  return matches;
}

function isRequireFromValibot(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0]?.type === 'Literal' &&
    isValibotModuleSource(node.arguments[0].value)
  );
}
