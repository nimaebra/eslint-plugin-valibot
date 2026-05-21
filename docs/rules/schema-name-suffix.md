# valibot/schema-name-suffix

📝 Require schema variables to use a consistent suffix such as Schema.

⚠️ This rule _warns_ in the 🎨 `stylistic` config.

<!-- end auto-generated rule header -->

Require schema variables to use a consistent suffix such as `Schema`.

## Why

Consistent schema naming makes it easier to distinguish runtime schema values from plain data objects and inferred TypeScript types.

## Incorrect

```ts
import * as v from 'valibot';

const User = v.object({ id: v.string() });
```

## Correct

```ts
import * as v from 'valibot';

const UserSchema = v.object({ id: v.string() });
```

## Options

- `suffix`: override the required suffix. The default is `Schema`.
- `exportedOnly`: only enforce the suffix for named exported schema bindings.

<!-- end auto-generated rule options -->

## Autofix

No.
