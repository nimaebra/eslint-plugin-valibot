import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const valibotVersion =
  getFlagValue('--valibot-version') ?? process.env.VALIBOT_VERSION ?? 'latest';
const tempDir = await mkdtemp(
  path.join(os.tmpdir(), 'eslint-plugin-valibot-smoke-pack-'),
);

try {
  runCommand('pnpm', ['build'], rootDir);
  runCommand('pnpm', ['pack', '--pack-destination', tempDir], rootDir);

  const tarballName = (await readdir(tempDir)).find((entry) =>
    entry.endsWith('.tgz'),
  );

  if (!tarballName) {
    throw new Error('pnpm pack did not produce a tarball.');
  }

  const fixtureDir = path.join(tempDir, 'fixture');
  const fixtureSrcDir = path.join(fixtureDir, 'src');

  await mkdir(fixtureSrcDir, { recursive: true });
  await writeFixtureFiles(fixtureDir);

  runCommand(
    'pnpm',
    [
      'add',
      '-D',
      'eslint@10',
      'typescript-eslint@8',
      `valibot@${valibotVersion}`,
      path.join(tempDir, tarballName),
    ],
    fixtureDir,
  );

  const recommendedResult = runCommand(
    'pnpm',
    [
      'exec',
      'eslint',
      'src/recommended-invalid.js',
      '--config',
      'eslint.recommended.config.mjs',
      '--format',
      'json',
    ],
    fixtureDir,
    true,
  );
  const strictResult = runCommand(
    'pnpm',
    [
      'exec',
      'eslint',
      'src/strict-invalid.ts',
      '--config',
      'eslint.strict.config.mjs',
      '--format',
      'json',
    ],
    fixtureDir,
    true,
  );

  assertLintFailure(recommendedResult, 'valibot/no-unguarded-parse');
  assertLintFailure(strictResult, 'valibot/no-schema-as-type');
} finally {
  await rm(tempDir, { force: true, recursive: true });
}

function getFlagValue(flagName: string): string | null {
  const flagIndex = process.argv.indexOf(flagName);

  if (flagIndex === -1) {
    return null;
  }

  return process.argv[flagIndex + 1] ?? null;
}

function writeFixtureFiles(fixtureDir: string) {
  return Promise.all([
    writeFile(
      path.join(fixtureDir, 'package.json'),
      JSON.stringify(
        {
          name: 'eslint-plugin-valibot-smoke-pack-fixture',
          private: true,
          type: 'module',
        },
        null,
        2,
      ),
      'utf8',
    ),
    writeFile(
      path.join(fixtureDir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'Bundler',
            strict: true,
            noEmit: true,
            skipLibCheck: true,
          },
          include: ['src/**/*.ts'],
        },
        null,
        2,
      ),
      'utf8',
    ),
    writeFile(
      path.join(fixtureDir, 'eslint.recommended.config.mjs'),
      [
        "import valibot from 'eslint-plugin-valibot';",
        '',
        'export default [',
        '  {',
        "    files: ['src/**/*.js'],",
        '    languageOptions: {',
        '      ecmaVersion: 2022,',
        "      sourceType: 'module',",
        '    },',
        '  },',
        '  ...valibot.flatConfigs.recommended,',
        '];',
      ].join('\n'),
      'utf8',
    ),
    writeFile(
      path.join(fixtureDir, 'eslint.strict.config.mjs'),
      [
        "import path from 'node:path';",
        "import { fileURLToPath } from 'node:url';",
        '',
        "import tseslint from 'typescript-eslint';",
        "import valibot from 'eslint-plugin-valibot';",
        '',
        'const fixtureDir = path.dirname(fileURLToPath(import.meta.url));',
        '',
        'export default tseslint.config(',
        '  {',
        "    files: ['src/**/*.ts'],",
        '    languageOptions: {',
        '      parserOptions: {',
        '        projectService: true,',
        '        tsconfigRootDir: fixtureDir,',
        '      },',
        '    },',
        '  },',
        '  ...tseslint.configs.recommended,',
        '  ...valibot.flatConfigs.strict,',
        ');',
      ].join('\n'),
      'utf8',
    ),
    writeFile(
      path.join(fixtureDir, 'src', 'recommended-invalid.js'),
      [
        "import * as v from 'valibot';",
        '',
        "const input = 'value';",
        'const parsedValue = v.parse(v.string(), input);',
        '',
        'export { parsedValue };',
      ].join('\n'),
      'utf8',
    ),
    writeFile(
      path.join(fixtureDir, 'src', 'strict-invalid.ts'),
      [
        "import * as v from 'valibot';",
        '',
        'const UserSchema = v.object({',
        '  id: v.string(),',
        '});',
        '',
        'export type User = typeof UserSchema;',
        '',
        'export { UserSchema };',
      ].join('\n'),
      'utf8',
    ),
  ]);
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  allowFailure = false,
) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (!allowFailure && result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(' ')}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return result;
}

function assertLintFailure(
  result: ReturnType<typeof runCommand>,
  expectedRuleId: string,
) {
  if (result.status !== 1) {
    throw new Error(
      `Expected lint command to fail with exit code 1, received ${String(result.status)}.\n${result.stdout}\n${result.stderr}`,
    );
  }

  const parsed = JSON.parse(result.stdout) as Array<{
    messages: Array<{ ruleId: string | null }>;
  }>;

  const ruleIds = new Set(
    parsed.flatMap((report) =>
      report.messages.map((message) => message.ruleId).filter(Boolean),
    ),
  );

  if (!ruleIds.has(expectedRuleId)) {
    throw new Error(
      `Expected lint report to include ${expectedRuleId}. Received: ${[...ruleIds].join(', ')}`,
    );
  }
}
