import { spawnSync } from 'node:child_process';
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const tempDirs: string[] = [];
const generatorPath = fileURLToPath(
  new URL('../../scripts/generate-rule.ts', import.meta.url),
);
const tsxLoaderUrl = import.meta.resolve('tsx/esm');

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

async function createFixture() {
  const rootDir = await mkdtemp(
    path.join(os.tmpdir(), 'valibot-generate-rule-'),
  );
  tempDirs.push(rootDir);
  await mkdir(path.join(rootDir, 'scripts'));
  await writeFile(path.join(rootDir, 'package.json'), '{"type":"module"}');
  const scriptPath = path.join(rootDir, 'scripts/generate-rule.ts');
  await copyFile(generatorPath, scriptPath);

  return {
    rootDir,
    run(name?: string) {
      return spawnSync(
        process.execPath,
        [
          '--import',
          tsxLoaderUrl,
          scriptPath,
          ...(name === undefined ? [] : [name]),
        ],
        {
          cwd: rootDir,
          encoding: 'utf8',
        },
      );
    },
  };
}

describe('rule generator', () => {
  it('creates source, tests, and docs and explains the registry step', async () => {
    const fixture = await createFixture();
    const result = fixture.run('no-example-schema');

    expect(result.status, result.stderr).toBe(0);
    expect(
      await readFile(
        path.join(fixture.rootDir, 'src/rules/no-example-schema.ts'),
        'utf8',
      ),
    ).toContain('export const noExampleSchema');
    expect(
      await readFile(
        path.join(fixture.rootDir, 'tests/rules/no-example-schema.test.ts'),
        'utf8',
      ),
    ).toContain("ruleTester.run('no-example-schema'");
    expect(
      await readFile(
        path.join(fixture.rootDir, 'docs/rules/no-example-schema.md'),
        'utf8',
      ),
    ).toContain('<!-- end auto-generated rule options -->');
    expect(result.stdout).toContain('src/rules/registry.ts');
  });

  it.each(['src/rules', 'tests/rules', 'docs/rules'])(
    'refuses an existing file in %s before creating any other files',
    async (directory) => {
      const fixture = await createFixture();
      const extension =
        directory === 'docs/rules'
          ? '.md'
          : directory === 'tests/rules'
            ? '.test.ts'
            : '.ts';
      const existingPath = path.join(
        fixture.rootDir,
        directory,
        `no-example-schema${extension}`,
      );
      await mkdir(path.dirname(existingPath), { recursive: true });
      await writeFile(existingPath, 'maintainer work');

      const result = fixture.run('no-example-schema');

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Refusing to overwrite');
      expect(await readFile(existingPath, 'utf8')).toBe('maintainer work');
      for (const relativePath of [
        'src/rules/no-example-schema.ts',
        'tests/rules/no-example-schema.test.ts',
        'docs/rules/no-example-schema.md',
      ]) {
        const target = path.join(fixture.rootDir, relativePath);
        if (target !== existingPath) {
          await expect(readFile(target)).rejects.toMatchObject({
            code: 'ENOENT',
          });
        }
      }
    },
  );

  it.each([
    undefined,
    '../escape',
    '1-schema',
    '-schema',
    'schema-',
    'no--schema',
    'class',
    'await',
  ])('rejects an invalid rule name: %s', async (name) => {
    const fixture = await createFixture();
    const result = fixture.run(name);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Provide a kebab-case rule name');
    await expect(
      readFile(path.join(fixture.rootDir, 'src')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
