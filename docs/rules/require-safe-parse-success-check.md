# valibot/require-safe-parse-success-check

📝 Require checking result.success before reading output or issues from a Valibot safeParse() result.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

Require checking `result.success` before reading or destructuring `output` or `issues` from a `safeParse()` result.

## Why

`safeParse()` returns a discriminated result object. Reading or destructuring `output` or `issues` without checking `success` makes the control flow ambiguous and hides validation failures.

## Incorrect

```ts
import * as v from 'valibot';

const result = v.safeParse(v.string(), input);
const { output } = result;
console.log(output);
```

## Correct

```ts
import * as v from 'valibot';

const result = v.safeParse(v.string(), input);

if (result.success) {
  const { output } = result;
  console.log(output);
} else {
  console.log(result.issues);
}
```

The rule also understands guarded access through boolean expressions such as `if (ready && result.success)` and `switch (result.success)`.

<!-- end auto-generated rule options -->

## Autofix

No.
