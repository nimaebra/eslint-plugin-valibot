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
        code: 'const user = other.object({}); export { user }; export type User = InferOutput<typeof user>;',
      },
      {
        code: "import * as v from 'valibot'; export function createUser() { return v.object({}); } export interface User { id: string } export default v.string();",
      },
      {
        code: "import * as v from 'valibot'; export const { user } = factory(); export const count = 1; export type Count = number;",
      },
      // Exported inferred types do not pull private schemas into exported scope.
      {
        code: "import * as v from 'valibot'; const user = v.object({}); export type User = v.InferOutput<typeof user>;",
      },
      {
        code: "import * as v from 'valibot'; export const UserSchema = v.object({}); type PrivateUser = v.InferOutput<typeof UserSchema>;",
      },
      {
        code: "import * as v from 'valibot'; export const UserSchema = v.object({}); export type User = other.InferOutput<typeof UserSchema>; export type Missing = v.InferOutput; export type Plain = v.InferOutput<UserSchema>; export type Qualified = v.InferOutput<typeof models.UserSchema>; export type Nested = v.types.InferOutput<typeof UserSchema>;",
      },
      {
        code: "import { object, type InferInput as Input, type InferOutput as Output } from 'valibot'; const UserSchema = object({}); type UserInput = Input<typeof UserSchema>; type UserOutput = Output<typeof UserSchema>; export { UserSchema, type UserInput }; export type { UserOutput };",
      },
      {
        code: "import * as v from 'valibot'; const UserSchema = v.object({}); export default UserSchema;",
      },
      {
        code: "import * as v from 'valibot'; export const UserValidator = v.object({}); export type UserRequest = v.InferInput<typeof UserValidator>; export type UserResponse = v.InferOutput<typeof UserValidator>; export type UserPayload = v.InferOutput<typeof UserValidator>;",
        options: [
          {
            schemaSuffix: 'Validator',
            inputSuffix: 'Request',
            outputSuffix: 'Response',
            dataSuffix: 'Payload',
          },
        ],
      },
      {
        code: "import * as v from 'valibot'; const User = v.object({}); type User = v.InferInput<typeof User>;",
        options: [{ convention: 'same-name', scope: 'all' }],
      },
      // A suffix alone is a base name, not an empty name after normalization.
      {
        code: "import * as v from 'valibot'; export const SchemaSchema = v.object({});",
      },
      {
        code: "import * as v from 'valibot';\nexport const UserSchema = v.objectAsync({ id: v.string() });\nexport type UserOutput = v.InferOutput<typeof UserSchema>;",
      },
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
        code: "import * as v from 'valibot'; const user_profile = v.object({}); export default user_profile;",
        errors: [
          {
            messageId: 'schemaNameConvention',
            data: { convention: 'suffix', expectedName: 'UserProfileSchema' },
          },
        ],
      },
      {
        code: "import * as v from 'valibot'; const userSchema = v.object({}); export { userSchema as User };",
        errors: [
          {
            messageId: 'schemaNameConvention',
            data: { convention: 'suffix', expectedName: 'UserSchema' },
          },
        ],
      },
      {
        code: "import { object, type InferInput as Input } from 'valibot'; export const UserSchema = object({}); type Request = Input<typeof UserSchema>; export type { Request as PublicRequest };",
        errors: [
          {
            messageId: 'typeNameConvention',
            data: { convention: 'suffix', expectedName: 'UserInput' },
          },
        ],
      },
      {
        code: "import * as v from 'valibot'; export const UserSchema = v.object({}); type Result = v.InferOutput<typeof UserSchema>; export { type Result };",
        errors: [
          {
            messageId: 'typeNameConvention',
            data: { convention: 'suffix', expectedName: 'UserOutput' },
          },
        ],
      },
      {
        code: "import * as v from 'valibot'; const UserSchema = v.object({}); type Result = v.InferOutput<typeof UserSchema>;",
        options: [{ scope: 'all' }],
        errors: [
          {
            messageId: 'typeNameConvention',
            data: { convention: 'suffix', expectedName: 'UserOutput' },
          },
        ],
      },
      {
        code: "import * as v from 'valibot'; export const UserValidator = v.object({}); export type User = v.InferInput<typeof UserValidator>;",
        options: [{ schemaSuffix: 'Validator', inputSuffix: 'Request' }],
        errors: [
          {
            messageId: 'typeNameConvention',
            data: { convention: 'suffix', expectedName: 'UserRequest' },
          },
        ],
      },
      // Strip the longest configured suffix first (InputSchema also ends in Schema).
      {
        code: "import * as v from 'valibot'; export const UserInputSchema = v.object({});",
        options: [{ inputSuffix: 'InputSchema' }],
        errors: [
          {
            messageId: 'schemaNameConvention',
            data: { convention: 'suffix', expectedName: 'UserSchema' },
          },
        ],
      },
      {
        code: "import * as v from 'valibot'; export const Schema = v.object({});",
        errors: [
          {
            messageId: 'schemaNameConvention',
            data: { convention: 'suffix', expectedName: 'SchemaSchema' },
          },
        ],
      },
      {
        code: "import * as v from 'valibot';\nexport const User = v.objectAsync({ id: v.string() });",
        errors: [
          {
            messageId: 'schemaNameConvention',
            data: { convention: 'suffix', expectedName: 'UserSchema' },
          },
        ],
      },
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
