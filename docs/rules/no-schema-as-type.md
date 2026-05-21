# valibot/no-schema-as-type

📝 Disallow using a Valibot schema value itself as a TypeScript type.

💼 This rule is enabled in the 🔒 `strict` config.

<!-- end auto-generated rule header -->

Disallow using a Valibot schema value itself as a TypeScript type.

## Why

`typeof UserSchema` describes the schema object, not the input or output value that the schema validates. In Valibot code, those data types should usually come from `InferInput` or `InferOutput` instead.

## Incorrect

```ts
import * as v from 'valibot';

const UserSchema = v.object({ id: v.string() });
type User = typeof UserSchema;
```

## Correct

```ts
import * as v from 'valibot';

const UserSchema = v.object({ id: v.string() });
type User = v.InferOutput<typeof UserSchema>;
```

<!-- end auto-generated rule options -->

## Autofix

No.
