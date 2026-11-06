import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

const referencesBySource = new WeakMap<
  Readonly<TSESLint.SourceCode>,
  WeakMap<TSESTree.Identifier, TSESLint.Scope.Variable>
>();

/** Use the parser's resolution for this occurrence, including type/value scope. */
export function getReferencedVariable(
  sourceCode: Readonly<TSESLint.SourceCode>,
  identifier: TSESTree.Identifier,
): TSESLint.Scope.Variable | undefined {
  let references = referencesBySource.get(sourceCode);
  if (!references) {
    references = new WeakMap();
    for (const scope of sourceCode.scopeManager?.scopes ?? []) {
      for (const reference of scope.references) {
        if (reference.identifier.type === 'Identifier' && reference.resolved) {
          references.set(reference.identifier, reference.resolved);
        }
      }
    }
    referencesBySource.set(sourceCode, references);
  }
  return references.get(identifier);
}
