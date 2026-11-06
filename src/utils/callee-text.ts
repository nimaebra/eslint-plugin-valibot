import type { TSESTree } from '@typescript-eslint/utils';

import {
  isValibotBinding,
  type ValibotImports,
} from './collect-valibot-imports';

/**
 * Builds the callee text for `apiName` in the same import style as `call`:
 * `v.apiName` for namespace calls, or the local binding for named imports.
 * Returns `null` when `apiName` is not imported, so fixers can bail out
 * instead of referencing an undefined identifier.
 */
export function getValibotCalleeText(
  call: TSESTree.CallExpression,
  imports: ValibotImports,
  apiName: string,
): string | null {
  if (call.callee.type === 'MemberExpression') {
    return call.callee.object.type === 'Identifier' &&
      isValibotBinding(call.callee.object, imports, call.callee.object.name)
      ? `${call.callee.object.name}.${apiName}`
      : null;
  }

  for (const [localName, importedName] of imports.importedNames) {
    if (
      importedName === apiName &&
      isValibotBinding(call, imports, localName)
    ) {
      return localName;
    }
  }

  return null;
}
