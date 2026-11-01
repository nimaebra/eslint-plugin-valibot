# valibot/no-discarded-safe-parse

📝 Disallow discarding the result of safeParse() or awaited safeParseAsync().

<!-- end auto-generated rule header -->

Require handling the result of `safeParse()` and awaited `safeParseAsync()`. These APIs return success and issues instead of throwing when validation fails.

This rule is opt-in and is also enabled by `all`. It is not included in `recommended`, `strict`, or `stylistic`.

## Incorrect

```ts
import * as v from 'valibot';

v.safeParse(UserSchema, input);
await v.safeParseAsync(UserSchema, input);
```

## Correct

```ts
import * as v from 'valibot';

const result = v.safeParse(UserSchema, input);
if (!result.success) {
  report(result.issues);
}

handle(await v.safeParseAsync(UserSchema, input));
```

<!-- end auto-generated rule options -->

## Scope

The rule checks bare expression statements. Returning, assigning, inspecting, or passing a result to a handler is accepted. It does not determine whether a handler eventually checks the result. Unawaited async calls belong to `no-unawaited-parse-async`, so enabling both rules does not duplicate that diagnostic. An explicit `void` expression is treated as an intentional discard.

## Autofix

No. Choose how your application should handle validation failures; switching to `parse()` would introduce throwing behavior.

## Further Reading

- [Valibot safeParse() API](https://valibot.dev/api/safeParse/)
