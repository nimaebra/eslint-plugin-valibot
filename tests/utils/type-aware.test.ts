import { fileURLToPath } from 'node:url';

import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import { createRule } from '../../src/utils/create-rule';
import {
  getParserServicesOrNull,
  hasTypeInformation,
} from '../../src/utils/type-aware';

const probeRule = createRule<[], 'typed' | 'untyped'>({
  name: 'parser-services-probe',
  meta: {
    type: 'problem',
    docs: { description: 'Probe real ESLint parser services in tests.' },
    schema: [],
    messages: { typed: 'Type: {{type}}', untyped: 'No type information.' },
  },
  defaultOptions: [],
  create(context) {
    const services = getParserServicesOrNull(context);

    expect(hasTypeInformation(context)).toBe(services !== null);

    return {
      VariableDeclarator(node) {
        if (!services?.program) {
          context.report({ node, messageId: 'untyped' });
          return;
        }

        const checker = services.program.getTypeChecker();
        const type = checker.getTypeAtLocation(
          services.esTreeNodeToTSNodeMap.get(node.id),
        );

        context.report({
          node,
          messageId: 'typed',
          data: { type: checker.typeToString(type) },
        });
      },
    };
  },
});

function lint(
  code: string,
  languageOptions: Linter.LanguageOptions = {},
  filename = 'file.js',
) {
  return new Linter().verify(
    code,
    [
      {
        files: ['**/*.js', '**/*.ts'],
        languageOptions,
        plugins: { probe: { rules: { services: probeRule as never } } },
        rules: { 'probe/services': 'error' },
      },
    ],
    { filename },
  );
}

describe('type-aware parser service helpers', () => {
  it('falls back safely with the default JavaScript parser', () => {
    expect(
      lint('const answer = 42;').map(({ messageId }) => messageId),
    ).toEqual(['untyped']);
  });

  it('falls back safely with TypeScript syntax but no project', () => {
    expect(
      lint(
        'const answer: number = 42;',
        { parser: tseslint.parser },
        'file.ts',
      ).map(({ messageId }) => messageId),
    ).toEqual(['untyped']);
  });

  it('returns usable node maps and a real type checker with project services', () => {
    // Avoid loading the repository's dependency graph under coverage.
    const fixtureDirectory = fileURLToPath(
      new URL('../fixtures/type-aware/', import.meta.url),
    );
    const messages = lint(
      'export const answer: number = 42;',
      {
        parser: tseslint.parser,
        parserOptions: {
          tsconfigRootDir: fixtureDirectory,
          projectService: true,
        },
      },
      fileURLToPath(
        new URL('../fixtures/type-aware/typed.ts', import.meta.url),
      ),
    );

    expect(
      messages.map(({ messageId, message }) => ({ messageId, message })),
    ).toEqual([{ messageId: 'typed', message: 'Type: number' }]);
  });
});
