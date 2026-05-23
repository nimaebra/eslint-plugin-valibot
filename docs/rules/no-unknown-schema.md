# valibot/no-unknown-schema

📝 Disallow Valibot unknown() schemas.

⚠️ This rule _warns_ in the 🔒 `strict` config.

<!-- end auto-generated rule header -->

Disallow `unknown()` schemas imported from Valibot.

## Why

`unknown()` accepts any input and pushes the real validation decision downstream. In most cases, a more precise schema communicates intent better and keeps validation closer to the boundary.

## Incorrect

```ts
import * as v from 'valibot';

const PayloadSchema = v.unknown();
```

## Correct

```ts
import * as v from 'valibot';

const PayloadSchema = v.string();
```

<!-- end auto-generated rule options -->

## Autofix

No. This rule does not provide autofix because replacing `unknown()` requires choosing a more specific schema based on application constraints.

## Further Reading

- [Valibot unknown() API](https://valibot.dev/api/unknown/)
