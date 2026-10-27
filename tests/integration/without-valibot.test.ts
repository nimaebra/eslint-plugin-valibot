import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

it('loads both built entry points and lints without Valibot installed', async () => {
  const fixtureDir = await mkdtemp(
    path.join(os.tmpdir(), 'valibot-optional-peer-'),
  );

  try {
    const modulesDir = path.join(fixtureDir, 'node_modules');
    const pluginDir = path.join(modulesDir, 'eslint-plugin-valibot');
    await mkdir(pluginDir, { recursive: true });
    await mkdir(path.join(modulesDir, '@typescript-eslint'), {
      recursive: true,
    });
    await cp(path.join(rootDir, 'dist'), path.join(pluginDir, 'dist'), {
      recursive: true,
    });
    await cp(
      path.join(rootDir, 'package.json'),
      path.join(pluginDir, 'package.json'),
    );

    // Provide the ESLint tools independently so this test isolates the Valibot
    // peer rather than relying on package hoisting from the repository.
    for (const name of ['eslint', '@typescript-eslint/utils']) {
      await symlink(
        path.dirname(require.resolve(`${name}/package.json`)),
        path.join(modulesDir, name),
        'junction',
      );
    }

    await writeFile(
      path.join(fixtureDir, 'consumer.mjs'),
      [
        "import assert from 'node:assert/strict';",
        "import { createRequire } from 'node:module';",
        "import { Linter } from 'eslint';",
        "import plugin from 'eslint-plugin-valibot';",
        'const require = createRequire(import.meta.url);',
        "assert.throws(() => require.resolve('valibot'), { code: 'MODULE_NOT_FOUND' });",
        "const cjs = require('eslint-plugin-valibot');",
        'for (const api of [plugin, cjs.default]) {',
        '  const messages = new Linter().verify(',
        "    \"import * as v from 'valibot'; v.parse(v.string(), 'value');\",",
        '    api.flatConfigs.recommended,',
        '  );',
        "  assert.deepEqual(messages.map(message => message.ruleId), ['valibot/no-unguarded-parse']);",
        '}',
      ].join('\n'),
    );
    const result = spawnSync(process.execPath, ['consumer.mjs'], {
      cwd: fixtureDir,
      encoding: 'utf8',
      timeout: 10000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr || result.stdout).toBe(0);
  } finally {
    await rm(fixtureDir, { recursive: true, force: true });
  }
});
