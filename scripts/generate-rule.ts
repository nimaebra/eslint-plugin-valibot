import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const ruleName = process.argv[2];
const reservedBindingNames = new Set(
  (
    'arguments await break case catch class const continue debugger default delete do else ' +
    'enum eval export extends false finally for function if implements import in instanceof ' +
    'interface let new null package private protected public return static super switch ' +
    'this throw true try typeof var void while with yield'
  ).split(' '),
);

if (
  !ruleName ||
  !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(ruleName) ||
  reservedBindingNames.has(toCamelCase(ruleName))
) {
  throw new Error(
    'Provide a kebab-case rule name, for example: pnpm create:rule prefer-schema-name',
  );
}

const variableName = toCamelCase(ruleName);
const sourcePath = path.join(rootDir, 'src', 'rules', `${ruleName}.ts`);
const testPath = path.join(rootDir, 'tests', 'rules', `${ruleName}.test.ts`);
const docPath = path.join(rootDir, 'docs', 'rules', `${ruleName}.md`);

// Check every target before writing so a collision in tests or docs cannot
// leave a newly created source file beside an existing rule.
for (const targetPath of [sourcePath, testPath, docPath]) {
  try {
    await access(targetPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      continue;
    }
    throw error;
  }

  throw new Error(
    `Refusing to overwrite existing file: ${path.relative(rootDir, targetPath)}`,
  );
}

await mkdir(path.dirname(sourcePath), { recursive: true });
await mkdir(path.dirname(testPath), { recursive: true });
await mkdir(path.dirname(docPath), { recursive: true });

await writeFile(
  sourcePath,
  [
    "import { createRule } from '../utils/create-rule';",
    '',
    'type Options = [];',
    `type MessageIds = '${variableName}';`,
    '',
    `export const ${variableName} = createRule<Options, MessageIds>({`,
    `  name: '${ruleName}',`,
    '  meta: {',
    "    type: 'suggestion',",
    '    docs: {',
    `      description: 'TODO: describe ${ruleName}.',`,
    '    },',
    '    schema: [],',
    '    messages: {',
    `      ${variableName}: 'TODO: add message.',`,
    '    },',
    '  },',
    '  defaultOptions: [],',
    '  create() {',
    '    return {};',
    '  },',
    '});',
    '',
  ].join('\n'),
  { encoding: 'utf8', flag: 'wx' },
);

await writeFile(
  testPath,
  [
    "import { RuleTester } from 'eslint';",
    '',
    `import { ${variableName} } from '../../src/rules';`,
    '',
    'const ruleTester = new RuleTester({',
    '  languageOptions: {',
    '    ecmaVersion: 2022,',
    "    sourceType: 'module',",
    '  },',
    '});',
    '',
    `ruleTester.run('${ruleName}', ${variableName} as never, {`,
    '  valid: [],',
    '  invalid: [],',
    '});',
    '',
  ].join('\n'),
  { encoding: 'utf8', flag: 'wx' },
);

await writeFile(
  docPath,
  [
    `# valibot/${ruleName}`,
    '',
    '<!-- end auto-generated rule header -->',
    '',
    `TODO: describe ${ruleName}.`,
    '',
    '## Why',
    '',
    `TODO: explain why ${ruleName} matters.`,
    '',
    '## Incorrect',
    '',
    '```ts',
    '// TODO: add invalid example.',
    '```',
    '',
    '## Correct',
    '',
    '```ts',
    '// TODO: add valid example.',
    '```',
    '',
    '<!-- end auto-generated rule options -->',
    '',
    '## Autofix',
    '',
    'No.',
    '',
  ].join('\n'),
  { encoding: 'utf8', flag: 'wx' },
);

process.stdout.write(
  [
    'Created:',
    `- ${path.relative(rootDir, sourcePath)}`,
    `- ${path.relative(rootDir, testPath)}`,
    `- ${path.relative(rootDir, docPath)}`,
    'Next: export the rule from src/rules/index.ts, register it in src/rules/registry.ts, and decide whether to export it from src/index.ts. Complete the tests and docs, then build and run pnpm docs:build.',
  ].join('\n'),
);

function toCamelCase(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, character: string) =>
    character.toUpperCase(),
  );
}
