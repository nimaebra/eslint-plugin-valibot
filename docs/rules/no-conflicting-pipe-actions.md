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

- Length constraints use `minLength()`, `maxLength()`, and `length()`.
- Size constraints use `minSize()`, `maxSize()`, and `size()`.
- Numeric value constraints use `minValue()` and `maxValue()`.

Each comparison uses finite numeric literals in the same group. An exact constraint supplies both a lower and an upper bound.

## Async APIs

The same conflict checks apply to `pipeAsync()`. These length limits cannot both pass:

```ts
import * as v from 'valibot';

const Schema = v.pipeAsync(v.string(), v.minLength(10), v.maxLength(5));
```

## Further Reading

- [Valibot pipe() API](https://valibot.dev/api/pipe/)

## Analysis boundaries

Bounds are compared across known built-in validations that preserve the value, such as `email()` and `regex()`. Transformations, callback-based checks, unknown calls, action identifiers, and spreads end the comparison. Each uninterrupted group reports one contradiction per constraint type.
