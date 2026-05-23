# valibot/no-any-schema

📝 Disallow Valibot any() schemas.

⚠️ This rule _warns_ in the 🔒 `strict` config.

<!-- end auto-generated rule header -->

Disallow `any()` schemas imported from Valibot.

## Why

`any()` removes most of the type-safety and intent that Valibot is meant to preserve. In most cases, `unknown()` or a more precise schema is a better choice.

## Incorrect

```ts
import * as v from 'valibot';

const PayloadSchema = v.any();
```

## Correct

```ts
import * as v from 'valibot';

const PayloadSchema = v.unknown();
```

<!-- end auto-generated rule options -->

## Autofix

No. This rule does not provide autofix because replacing `any()` with `unknown()` or a concrete schema is a modeling decision that cannot be inferred safely.

## Further Reading

- [Valibot any() API](https://valibot.dev/api/any/)
- [Valibot unknown() API](https://valibot.dev/api/unknown/)
