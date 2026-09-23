import { ESLintUtils } from '@typescript-eslint/utils';

const DOCS_BASE_URL =
  'https://github.com/nimaebra/eslint-plugin-valibot/blob/main/docs/rules';

export const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `${DOCS_BASE_URL}/${ruleName}.md`,
);
