import { runInNewContext } from 'node:vm';
import { Linter } from 'eslint';
import * as v from 'valibot';
import plugin from '../../src/plugin';

export function ruleConfig(rule: string): Linter.Config[] {
  return [
    {
      plugins: { valibot: plugin as never },
      rules: { [`valibot/${rule}`]: 'error' },
    },
  ];
}

export function fixRule(rule: string, code: string) {
  return new Linter().verifyAndFix(code, ruleConfig(rule));
}

export function suggestRule(rule: string, code: string) {
  const messages = new Linter().verify(code, ruleConfig(rule));
  const suggestion = messages[0]?.suggestions?.[0];
  if (!suggestion) throw new Error(`No suggestion for ${rule}`);
  const { range, text } = suggestion.fix;
  const output = code.slice(0, range[0]) + text + code.slice(range[1]);
  const parsed = new Linter().verify(output, ruleConfig(rule));
  if (parsed.some((message) => message.fatal))
    throw new Error(`Invalid suggestion for ${rule}`);
  return output;
}

export function evaluateRuleCode(
  code: string,
  bindings: Record<string, unknown> = {},
): unknown {
  return runInNewContext(
    code,
    { require: () => v, Date, ...bindings },
    { timeout: 1000 },
  );
}
