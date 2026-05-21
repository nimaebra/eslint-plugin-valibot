import { ESLint } from 'eslint';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { ruleRegistry } from '../../src/rules';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(testDir, '../..');
const eslintBin = path.join(
  rootDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'eslint.cmd' : 'eslint',
);
const expectedJavaScriptStrictRuleIds = getRuleIdsForConfig('strict', false);
const expectedTypeScriptStrictRuleIds = getRuleIdsForConfig('strict', true);

describe('package integration examples', () => {
  it('lints the flat-config example with the built package', () => {
    const result = runEslint(path.join(rootDir, 'examples/flat'), [
      'src/invalid.js',
      '--format',
      'json',
    ]);

    expect(result.status).toBe(1);

    const report = parseSingleResult(result.stdout);
    const ruleIds = getSortedRuleIds(report.messages);

    expect(ruleIds).toEqual(expectedJavaScriptStrictRuleIds);
  });

  it('lints the legacy-config example with the built package', () => {
    return expect(lintLegacyExport()).resolves.toEqual(
      expectedJavaScriptStrictRuleIds,
    );
  });

  it('lints the TypeScript flat-config example with the built package', () => {
    const result = runEslint(path.join(rootDir, 'examples/typescript'), [
      'src/invalid.ts',
      '--format',
      'json',
    ]);

    expect(result.status).toBe(1);

    const report = parseSingleResult(result.stdout);
    const ruleIds = getSortedRuleIds(report.messages);

    expect(ruleIds).toEqual(expectedTypeScriptStrictRuleIds);
  });
});

function getRuleIdsForConfig(
  configName: 'recommended' | 'strict' | 'stylistic',
  typeScriptOnly: boolean,
): string[] {
  return ruleRegistry
    .filter(
      (entry) =>
        configName in entry.configs &&
        Boolean(entry.typeScriptOnly) === typeScriptOnly,
    )
    .map((entry) => `valibot/${entry.name}`)
    .sort();
}

function runEslint(
  cwd: string,
  args: string[],
  env: Record<string, string> = {},
) {
  return spawnSync(eslintBin, args, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
  });
}

function parseSingleResult(stdout: string) {
  const parsed = JSON.parse(stdout) as Array<{
    messages: Array<{ ruleId: string | null }>;
  }>;

  expect(parsed).toHaveLength(1);

  return parsed[0];
}

async function lintLegacyExport(): Promise<string[]> {
  const builtPluginModule = (await import(
    pathToFileURL(path.join(rootDir, 'dist/index.mjs')).href
  )) as {
    default?: { rules: Record<string, unknown> };
    configs: {
      strict: { rules?: Record<string, 'off' | 'warn' | 'error' | 0 | 1 | 2> };
    };
  };

  const plugin = builtPluginModule.default ?? builtPluginModule;
  const eslint = new ESLint({
    cwd: path.join(rootDir, 'examples/legacy'),
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['src/**/*.js'],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
        },
        plugins: {
          valibot: plugin as never,
        },
        rules: builtPluginModule.configs.strict.rules ?? {},
      },
    ],
  });

  const [report] = await eslint.lintFiles(['src/invalid.js']);

  return getSortedRuleIds(report.messages);
}

function getSortedRuleIds(
  messages: Array<{ ruleId: string | null }>,
): string[] {
  return [
    ...new Set(messages.map((message) => message.ruleId).filter(Boolean)),
  ].sort() as string[];
}
