# valibot/require-default-in-optional-pipe

📝 Require a default when optional() or nullish() starts a pipe inside an object schema entry.

⚠️ This rule _warns_ in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

Require a default when `optional()` or `nullish()` starts a `pipe()` inside an object schema entry.

## Why

For missing object keys, later pipe items do not run when the head wrapper is `optional()` or `nullish()` without a default. This can silently skip transforms and checks.

## Incorrect

```ts
import * as v from 'valibot';

const Schema = v.object({
  active: v.pipe(
    v.optional(v.string()),
    v.transform((value) => value === 'true'),
  ),
});
```

## Correct

```ts
import * as v from 'valibot';

const Schema = v.object({
  active: v.pipe(
    v.optional(v.string(), 'false'),
    v.transform((value) => value === 'true'),
  ),
});
```

<!-- end auto-generated rule options -->

## Autofix

No.
