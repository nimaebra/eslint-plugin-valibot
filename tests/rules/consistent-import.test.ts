import { RuleTester } from 'eslint';

import { consistentImport } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('consistent-import', consistentImport as never, {
  valid: [
    {
      code: "import * as v from 'valibot';\nconst Schema = v.object({ name: v.string() });",
    },
    {
      code: "import * as vali from 'valibot';\nconst Schema = vali.object({ name: vali.string() });",
      options: [{ namespaceAlias: 'vali' }],
    },
    {
      code: "import { object, string } from 'valibot';\nconst Schema = object({ name: string() });",
      options: [{ style: 'named' }],
    },
    {
      code: "import { object as vObject, string as vString } from 'valibot';\nconst Schema = vObject({ name: vString() });",
      options: [{ style: 'named' }],
    },
    {
      code: "import { object } from 'other-library';\nconst Schema = object({});",
    },
  ],
  invalid: [
    {
      code: "import { object, string } from 'valibot';\nconst Schema = object({ name: string() });",
      errors: [{ messageId: 'preferNamespace', data: { namespaceAlias: 'v' } }],
    },
    {
      code: "import * as valibot from 'valibot';\nconst Schema = valibot.object({ name: valibot.string() });",
      errors: [{ messageId: 'namespaceAlias', data: { expectedAlias: 'v' } }],
    },
    {
      code: "import * as v from 'valibot';\nconst Schema = v.object({ name: v.string() });",
      options: [{ style: 'named' }],
      errors: [{ messageId: 'preferNamed' }],
    },
    {
      code: "import valibot from 'valibot';\nconst Schema = valibot.object({ name: valibot.string() });",
      errors: [{ messageId: 'preferNamespace', data: { namespaceAlias: 'v' } }],
    },
    {
      code: "import valibot from 'valibot';\nconst Schema = valibot.object({ name: valibot.string() });",
      options: [{ style: 'named' }],
      errors: [{ messageId: 'preferNamed' }],
    },
  ],
});
