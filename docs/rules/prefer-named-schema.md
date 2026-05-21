# valibot/prefer-named-schema

📝 Prefer passing a named schema variable into Valibot parse-like APIs instead of an inline schema expression.

💼⚠️ This rule is enabled in the 🔒 `strict` config. This rule _warns_ in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

Prefer passing a named schema variable into Valibot parse-like APIs instead of building the schema inline at the call site.

## Why

Inline schema expressions make parse calls harder to scan, harder to reuse, and harder to test independently. Naming the schema keeps validation entrypoints focused on the runtime flow.

## Incorrect

```ts
import * as v from 'valibot';

const result = v.safeParse(v.object({ name: v.string() }), input);
```

## Correct

```ts
import * as v from 'valibot';

const UserSchema = v.object({ name: v.string() });
const result = v.safeParse(UserSchema, input);
```

<!-- end auto-generated rule options -->

## Autofix

No.
