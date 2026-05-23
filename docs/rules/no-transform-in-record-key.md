# valibot/no-transform-in-record-key

📝 Disallow transforms in record() key schemas, which can silently mutate keys and cause collisions.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

This rule disallows transforms in the key schema passed to Valibot `record()`.

When the key schema mutates values, Valibot applies that mutation to every incoming object key during parsing. That means distinct input keys can collapse into the same parsed key, which silently rewrites data and can drop earlier entries.

## Why

Most `record()` key schemas are meant to validate allowed keys, not normalize them.

For example, `record(pipe(string(), trim()), string())` rewrites both `' email '` and `'email'` to the same parsed key. If both keys are present, one value wins and the other is lost without an explicit error.

This rule keeps key schemas validation-only and leaves normalization to a separate preprocessing step where collisions are easier to reason about.

## Incorrect

```ts
import * as v from 'valibot';

const StringRecordSchema = v.record(v.pipe(v.string(), v.trim()), v.string());

const LowercaseKeys = v.record(
  v.pipe(v.string(), v.toLowerCase()),
  v.unknown(),
);

const CustomTransformKeys = v.record(
  v.pipe(
    v.string(),
    v.transform((input) => input.trim()),
  ),
  v.string(),
);
```

## Correct

```ts
import * as v from 'valibot';

const StringRecordSchema = v.record(v.string(), v.string());

const ValidatedKeys = v.record(v.pipe(v.string(), v.minLength(1)), v.string());

const TransformedValues = v.record(v.string(), v.pipe(v.string(), v.trim()));
```

<!-- end auto-generated rule options -->

## Autofix

No. This rule does not provide autofix because moving key transforms out of `record()` requires domain-specific collision handling that cannot be inferred automatically.

## Further Reading

- [Valibot record() API](https://valibot.dev/api/record/)
- [Valibot transform() API](https://valibot.dev/api/transform/)
- [Valibot pipe() API](https://valibot.dev/api/pipe/)
