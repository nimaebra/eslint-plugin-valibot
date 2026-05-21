import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateConfigsDoc } from './config-docs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const configsDocPath = path.join(rootDir, 'docs', 'configs.md');

await writeFile(configsDocPath, generateConfigsDoc(), 'utf8');
