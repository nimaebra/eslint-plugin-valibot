import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const ruleName = process.argv[2];

if (!ruleName || !/^[a-z0-9-]+$/.test(ruleName)) {
  throw new Error(
    'Provide a kebab-case rule name, for example: pnpm create:rule prefer-schema-name',
  );
}

const variableName = toCamelCase(ruleName);
const sourcePath = path.join(rootDir, 'src', 'rules', `${ruleName}.ts`);
const testPath = path.join(rootDir, 'tests', 'rules', `${ruleName}.test.ts`);
const docPath = path.join(rootDir, 'docs', 'rules', `${ruleName}.md`);

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
  'utf8',
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
  'utf8',
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
  'utf8',
);

process.stdout.write(
  [
    'Created:',
    `- ${path.relative(rootDir, sourcePath)}`,
    `- ${path.relative(rootDir, testPath)}`,
    `- ${path.relative(rootDir, docPath)}`,
    'Next: export the rule from src/rules/index.ts, wire it into the configs, then run pnpm docs:build.',
  ].join('\n'),
);

function toCamelCase(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, character: string) =>
    character.toUpperCase(),
  );
}
