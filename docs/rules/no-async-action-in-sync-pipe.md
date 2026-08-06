# valibot/no-async-action-in-sync-pipe

📝 Disallow async Valibot actions inside a synchronous pipe() call.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

This rule disallows async Valibot actions (such as `checkAsync()` or `transformAsync()`) inside a synchronous `pipe()` call.

## Why

Valibot's synchronous `pipe()` does not await async actions. When an async action's validation function runs inside `pipe()`, its result is a `Promise` object instead of a resolved dataset. `parse()` and `safeParse()` then read that `Promise` as if it were the validation result, which means the async check silently never runs and its issues are never reported.

TypeScript projects catch this at compile time because `pipe()`'s overloads only accept sync actions. Plain JavaScript projects, or code where type information is unavailable, get no warning and a schema that appears to work but skips its async validation.

The fix is not to await inside the action or convert only that one call: everything from the pipe outward, including the schema that contains it and every `parse()`/`safeParse()` call on it, needs to switch to the async equivalents (`pipeAsync()`, `parseAsync()`, `safeParseAsync()`, and any `*Async` schema wrappers around it).

## Incorrect

```ts
import * as v from 'valibot';

const UsernameSchema = v.pipe(
  v.string(),
  v.checkAsync(async (value) => isUsernameAvailable(value)),
);
```

## Correct

```ts
import * as v from 'valibot';

const UsernameSchema = v.pipeAsync(
  v.string(),
  v.checkAsync(async (value) => isUsernameAvailable(value)),
);

// callers must also switch to the async parse APIs
const result = await v.parseAsync(UsernameSchema, input);
```

<!-- end auto-generated rule options -->

## Autofix

No. Renaming `pipe()` to `pipeAsync()` is not enough on its own — every enclosing schema and every `parse()`/`safeParse()` call site also needs to become async, which this rule cannot determine or rewrite safely.

## Further Reading

- [Valibot pipeAsync() API](https://valibot.dev/api/pipeAsync/)
- [Valibot parseAsync() API](https://valibot.dev/api/parseAsync/)
