# valibot/prefer-nullish

📝 Prefer nullish() over nested optional() and nullable() wrappers.

⚠️ This rule _warns_ in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Prefer `nullish()` over nested `optional()` and `nullable()` wrappers.

## Why

Valibot provides `nullish()` specifically for values that may be `null` or `undefined`. Using it directly is shorter and clearer than nesting `optional()` and `nullable()`.

## Incorrect

```ts
import * as v from 'valibot';

const Schema = v.optional(v.nullable(v.string()));
```

## Correct

```ts
import * as v from 'valibot';

const Schema = v.nullish(v.string());
```

<!-- end auto-generated rule options -->

## Async APIs

Nested `optionalAsync()` and `nullableAsync()` wrappers are reported too. Their fix uses `nullishAsync()` when it is available. Mixed sync/async wrappers are left unchanged:

```ts
import * as v from 'valibot';

const NestedSchema = v.optionalAsync(v.nullableAsync(v.string()));
const Schema = v.nullishAsync(v.string());
```

## Autofix

Yes, when the nested wrappers are simple and a usable `nullish` callee is already available in the current import style.

## Further Reading

- [Valibot nullish() API](https://valibot.dev/api/nullish/)
- [Valibot optional() API](https://valibot.dev/api/optional/)
- [Valibot nullable() API](https://valibot.dev/api/nullable/)
