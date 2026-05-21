import { ESLintUtils, type TSESLint } from '@typescript-eslint/utils';

export const MISSING_TYPE_INFORMATION_MESSAGE =
  'This rule requires type information from @typescript-eslint/parser. Configure parserOptions.project or parserOptions.projectService.';

type ParserServicesWithTypeInformation = ReturnType<
  typeof ESLintUtils.getParserServices
>;

export function getParserServicesOrNull(
  context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>,
): ParserServicesWithTypeInformation | null {
  try {
    return ESLintUtils.getParserServices(context);
  } catch {
    return null;
  }
}

export function hasTypeInformation(
  context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>,
): boolean {
  return getParserServicesOrNull(context) !== null;
}
