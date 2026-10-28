import type { TSESTree } from '@typescript-eslint/utils';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import {
  collectValibotImports,
  hasValibotImports,
  isValibotModuleSource,
} from '../../src/utils/collect-valibot-imports';

function parse(code: string) {
  return tseslint.parser.parseForESLint(code).ast as TSESTree.Program;
}

describe('Valibot module sources', () => {
  it.each([
    'valibot',
    '@valibot/valibot',
    'npm:valibot',
    'npm:valibot@^1.0.0',
    'jsr:@valibot/valibot',
    'jsr:@valibot/valibot@~1.5.0',
  ])('recognizes %s', (source) => {
    expect(isValibotModuleSource(source)).toBe(true);
  });

  it.each([
    undefined,
    null,
    123,
    {},
    '',
    'other-valibot',
    '@other/valibot',
    './valibot',
    'valibot/subpath',
    'npm:valibot@1.0.0/subpath',
    'https://example.com/valibot',
  ])('rejects unrelated module source %j', (source) => {
    expect(isValibotModuleSource(source)).toBe(false);
  });
});

describe('collectValibotImports', () => {
  it('combines ESM, CommonJS, and aliased bindings without collecting other packages', () => {
    const program = parse(`
      import * as v from 'valibot';
      import { string as text, 'number' as numeric } from 'npm:valibot@1.5.0';
      import * as other from 'other-library';
      const common = require('jsr:@valibot/valibot@^1.0.0');
      const { object, union: either } = require('valibot');
      const ignored = require('other-library');
    `);
    const imports = collectValibotImports(program);

    expect([...imports.namespaces]).toEqual(['v', 'common']);
    expect([...imports.importedNames]).toEqual([
      ['text', 'string'],
      ['numeric', 'number'],
      ['object', 'object'],
      ['either', 'union'],
    ]);
    expect(hasValibotImports(imports)).toBe(true);
  });

  it('ignores unsupported destructuring without losing supported bindings', () => {
    const program = parse(`
      const [first] = require('valibot');
      const { string: text, number = fallback, 'object': obj, ...rest } = require('valibot');
      const uninitialized = undefined;
      let empty;
    `);
    const imports = collectValibotImports(program);

    expect([...imports.namespaces]).toEqual([]);
    expect([...imports.importedNames]).toEqual([['text', 'string']]);
  });

  it.each([
    "import 'valibot';",
    "import fallback from 'valibot';",
    'const v = require(moduleName);',
    "const v = require('valibot', options);",
    "const v = loader.require('valibot');",
    "async function load() { return import('valibot'); }",
    "function load() { const v = require('valibot'); }",
  ])('does not invent a usable binding for %s', (code) => {
    const imports = collectValibotImports(parse(code));

    expect(hasValibotImports(imports)).toBe(false);
    expect(imports.namespaces.size).toBe(0);
    expect(imports.importedNames.size).toBe(0);
  });

  it('keeps collection state isolated between files', () => {
    const first = collectValibotImports(parse("const v = require('valibot');"));
    const second = collectValibotImports(parse('const v = other;'));

    expect(hasValibotImports(first)).toBe(true);
    expect(hasValibotImports(second)).toBe(false);
  });
});
