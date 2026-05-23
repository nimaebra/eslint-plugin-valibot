# valibot/no-redundant-schema-wrappers

📝 Disallow redundant nested Valibot schema wrappers.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Disallow redundant nested Valibot wrappers such as `optional(optional(schema))`.

This rule flags duplicate chains of the following methods:

- `optional`
- `nullable`
- `nullish`
- `nonOptional`
- `nonNullable`
- `nonNullish`

## Why

Repeated wrappers add noise and usually do not change the schema behavior. They often appear during refactors or wrapper composition changes.

## Incorrect

```ts
import * as v from 'valibot';

const Schema = v.optional(v.optional(v.string()));
```

## Correct

```ts
import * as v from 'valibot';

const Schema = v.optional(v.string());
```

<!-- end auto-generated rule options -->

## Autofix

Yes, when both wrappers are identical and neither wrapper uses a default argument.

## Further Reading

- [Valibot optional() API](https://valibot.dev/api/optional/)
- [Valibot nullable() API](https://valibot.dev/api/nullable/)
- [Valibot nullish() API](https://valibot.dev/api/nullish/)
- [Valibot nonOptional() API](https://valibot.dev/api/nonOptional/)
- [Valibot nonNullable() API](https://valibot.dev/api/nonNullable/)
- [Valibot nonNullish() API](https://valibot.dev/api/nonNullish/)
