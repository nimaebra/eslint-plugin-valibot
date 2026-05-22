import { RuleTester } from 'eslint';

import { requireIssueMessages } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('require-issue-messages', requireIssueMessages as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst PasswordSchema = v.pipe(v.string('Must be text'), v.minLength(8, 'Password too short'), v.trim());",
    },
    {
      code: "import { message, string } from 'valibot';\nconst Schema = message(string(), 'Must be text');",
    },
    {
      code: "import { message, minLength, pipe, string } from 'valibot';\nconst Schema = pipe(string('Must be text'), message(minLength(8), 'Password too short'));",
    },
    {
      code: "import { object, string } from 'valibot';\nconst schemaMessage = 'Invalid profile';\nconst ProfileSchema = object({ name: string('Name is required') }, schemaMessage);",
    },
    {
      code: "import { string } from 'other-library';\nconst Schema = string();",
    },
  ],
  invalid: [
    {
      code: "import { string } from 'valibot';\nconst Schema = string();",
      errors: [
        {
          messageId: 'missingIssueMessage',
          data: { name: 'string' },
        },
      ],
    },
    {
      code: "import * as v from 'valibot';\nconst PasswordSchema = v.pipe(v.string(), v.minLength(8));",
      errors: [
        {
          messageId: 'missingIssueMessage',
          data: { name: 'string' },
        },
        {
          messageId: 'missingIssueMessage',
          data: { name: 'minLength' },
        },
      ],
    },
    {
      code: "import { object, string } from 'valibot';\nconst ProfileSchema = object({ name: string('Name is required') });",
      errors: [
        {
          messageId: 'missingIssueMessage',
          data: { name: 'object' },
        },
      ],
    },
    {
      code: "import { record, string, number } from 'valibot';\nconst Schema = record(string('Invalid key'), number('Invalid value'));",
      errors: [
        {
          messageId: 'missingIssueMessage',
          data: { name: 'record' },
        },
      ],
    },
    {
      code: "import { string } from 'valibot';\nconst Schema = string(undefined);",
      errors: [
        {
          messageId: 'missingIssueMessage',
          data: { name: 'string' },
        },
      ],
    },
    {
      code: "const { string } = require('valibot');\nconst Schema = string();",
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      errors: [
        {
          messageId: 'missingIssueMessage',
          data: { name: 'string' },
        },
      ],
    },
  ],
});
