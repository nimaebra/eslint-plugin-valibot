# valibot/no-conflicting-pipe-actions

📝 Disallow contradictory Valibot pipe actions in the same pipe() call.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

Disallow contradictory Valibot pipe actions in the same `pipe()` call.

## Why

Some pipe action combinations can never succeed together. For example, `minLength(10)` and `maxLength(5)` in the same pipe reject every possible input.

## Incorrect

```ts
import * as v from 'valibot';

const ConflictingLengthSchema = v.pipe(
  v.string(),
  v.minLength(10),
  v.maxLength(5),
);
```

## Correct

```ts
import * as v from 'valibot';

const LengthSchema = v.pipe(v.string(), v.minLength(2), v.maxLength(10));
```

<!-- end auto-generated rule options -->

## Supported checks

The initial version reports adjacent `minLength()` and `maxLength()` actions when the minimum is greater than the maximum and both limits are numeric literals. It does not report across intervening actions because a transformation could change the value's length.

## Further Reading

- [Valibot pipe() API](https://valibot.dev/api/pipe/)
