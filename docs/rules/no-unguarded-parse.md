# valibot/no-unguarded-parse

📝 Require Valibot parse() and assert() calls to be wrapped in try/catch.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

Require `parse()` and `assert()` calls to be wrapped in `try/catch`.

## Why

Valibot `parse()` and `assert()` throw when validation fails. In recoverable flows, code should catch those failures explicitly or use `safeParse()` instead.

## Incorrect

```ts
import * as v from 'valibot';

const value = v.parse(v.string(), input);
```

## Correct

```ts
import * as v from 'valibot';

try {
  const value = v.parse(v.string(), input);
  console.log(value);
} catch (error) {
  console.error(error);
}
```

<!-- end auto-generated rule options -->

## Autofix

No.
