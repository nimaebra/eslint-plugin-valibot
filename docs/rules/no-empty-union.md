# valibot/no-empty-union

📝 Disallow Valibot union() calls without schema options.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

Disallow Valibot `union()` calls without schema options or with an empty options array.

## Why

`union()` and `union([])` cannot accept any input and are almost always mistakes left behind after editing schema options.

## Incorrect

```ts
import * as v from 'valibot';

const EmptyUnionSchema = v.union([]);
```

## Correct

```ts
import * as v from 'valibot';

const StatusSchema = v.union([v.literal('active'), v.literal('inactive')]);
```

<!-- end auto-generated rule options -->

## Further Reading

- [Valibot union() API](https://valibot.dev/api/union/)
