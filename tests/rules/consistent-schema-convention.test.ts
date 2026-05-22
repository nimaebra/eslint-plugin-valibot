import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import { consistentSchemaConvention } from '../../src/rules';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    parser: tseslint.parser,
    sourceType: 'module',
  },
});

ruleTester.run(
  'consistent-schema-convention',
  consistentSchemaConvention as never,
  {
    valid: [
      {
        code: "import * as v from 'valibot';\nexport const ImageSchema = v.object({ id: v.string() });\nexport type ImageInput = v.InferInput<typeof ImageSchema>;\nexport type ImageOutput = v.InferOutput<typeof ImageSchema>;",
      },
      {
        code: "import * as v from 'valibot';\nconst User = v.object({ id: v.string() });",
      },
      {
        code: "import * as v from 'valibot';\nexport const PublicUser = v.object({ id: v.string() });\nexport type PublicUser = v.InferOutput<typeof PublicUser>;",
        options: [{ convention: 'same-name' }],
      },
      {
        code: "import * as v from 'valibot';\nconst UserSchema = v.object({ id: v.string() });\nexport { UserSchema };",
      },
      {
        code: "import * as v from 'valibot';\nexport const UserSchema = v.object({ id: v.string() });\nexport type UserData = v.InferOutput<typeof UserSchema>;",
      },
      {
        code: "import * as v from 'valibot';\nconst UserSchema = v.object({ id: v.string() });",
        options: [{ scope: 'all' }],
      },
    ],
    invalid: [
      {
        code: "import * as v from 'valibot';\nconst User = v.object({ id: v.string() });\nexport { User };",
        errors: [
          {
            messageId: 'schemaNameConvention',
            data: {
              convention: 'suffix',
              expectedName: 'UserSchema',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nexport const ImageSchema = v.object({ id: v.string() });\nexport type Image = v.InferOutput<typeof ImageSchema>;",
        errors: [
          {
            messageId: 'typeNameConvention',
            data: {
              convention: 'suffix',
              expectedName: 'ImageOutput',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nexport const PublicUserSchema = v.object({ id: v.string() });\nexport type PublicUserOutput = v.InferOutput<typeof PublicUserSchema>;",
        options: [{ convention: 'same-name' }],
        errors: [
          {
            messageId: 'schemaNameConvention',
            data: {
              convention: 'same-name',
              expectedName: 'PublicUser',
            },
          },
          {
            messageId: 'typeNameConvention',
            data: {
              convention: 'same-name',
              expectedName: 'PublicUser',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nexport const UserSchema = v.object({ id: v.string() });\nexport type UserData = v.InferOutput<typeof UserSchema>;",
        options: [{ allowDataSuffix: false }],
        errors: [
          {
            messageId: 'typeNameConvention',
            data: {
              convention: 'suffix',
              expectedName: 'UserOutput',
            },
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nconst User = v.object({ id: v.string() });",
        options: [{ scope: 'all' }],
        errors: [
          {
            messageId: 'schemaNameConvention',
            data: {
              convention: 'suffix',
              expectedName: 'UserSchema',
            },
          },
        ],
      },
    ],
  },
);
