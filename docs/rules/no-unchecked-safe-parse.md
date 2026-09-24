# valibot/no-unchecked-safe-parse

📝 Require checking the success of a Valibot safeParse() result before reading its output.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

Require checking `success` before reading `output` from a `safeParse()` or awaited `safeParseAsync()` result.

## Why

When validation fails, `safeParse()` still returns an `output`, and it holds the unvalidated input. Reading it without checking `success` lets invalid data flow on as if it had been validated. TypeScript does not always catch this, because `output` is typed loosely on failure.

The rule recognizes these guards:

- `if (result.success) { … }`, and the `else` branch of `if (!result.success)`
- early exits such as `if (!result.success) return;` or `throw`, `continue` and `break`
- `result.success ? result.output : fallback`
- `result.success && result.output`
- comparisons such as `result.success === true` or `result.success === false`

Results are tracked through `const` bindings and direct property access. Destructuring `output` without `success` is reported. Destructuring both is assumed to be checked.

## Incorrect

```ts
import * as v from 'valibot';

const result = v.safeParse(UserSchema, input);
save(result.output);

const { output } = v.safeParse(UserSchema, input);

const name = v.safeParse(UserSchema, input).output.name;
```

## Correct

```ts
import * as v from 'valibot';

const result = v.safeParse(UserSchema, input);

if (!result.success) {
  return v.flatten(result.issues);
}

save(result.output);
```

<!-- end auto-generated rule options -->

## Autofix

No. Handling the failure case depends on the surrounding code.

## Further Reading

- [Valibot safeParse() API](https://valibot.dev/api/safeParse/)
- [Valibot parse data guide](https://valibot.dev/guides/parse-data/)
