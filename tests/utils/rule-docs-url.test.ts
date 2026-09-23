import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import packageJson from '../../package.json';
import plugin from '../../src/plugin';

const repositoryUrl = packageJson.repository.url
  .replace(/^git\+/u, '')
  .replace(/\.git$/u, '');

describe('rule docs urls', () => {
  it.each(Object.entries(plugin.rules))(
    '%s links to its docs page in this repository',
    (name, rule) => {
      expect(rule.meta?.docs?.url).toBe(
        `${repositoryUrl}/blob/main/docs/rules/${name}.md`,
      );
      expect(existsSync(resolve('docs/rules', `${name}.md`))).toBe(true);
    },
  );
});
