import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ruleRegistry } from '../src/rules';

import { generateConfigsDoc } from './config-docs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs', 'rules');
const configsDocPath = path.join(rootDir, 'docs', 'configs.md');
const configsDoc = await readFile(configsDocPath, 'utf8');

for (const { name: ruleName } of ruleRegistry) {
  const docPath = path.join(docsDir, `${ruleName}.md`);

  await access(docPath);
}

if (configsDoc !== generateConfigsDoc()) {
  throw new Error('docs/configs.md is out of date. Run pnpm docs:build.');
}
