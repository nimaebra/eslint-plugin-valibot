# valibot/no-unawaited-parse-async

📝 Disallow using the result of Valibot parseAsync() or safeParseAsync() without awaiting it.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Disallow using `parseAsync()` or `safeParseAsync()` results without awaiting them.

## Why

Both functions return a promise. Reading a result property from the promise itself always gives `undefined`. For example, `if (v.safeParseAsync(Schema, input).success)` is never true, and `const { output } = v.safeParseAsync(…)` is always `undefined`. A call whose promise is dropped entirely loses both the result and any validation failure.

The rule reports:

- `parseAsync()` and `safeParseAsync()` calls used as standalone statements
- property reads such as `.success`, `.output` or `.issues` directly on the call
- `const` bindings and destructuring of the un-awaited promise that read such properties

Handling the promise with `await`, `.then()`, `.catch()` or `.finally()`, returning it, passing it to `Promise.all()` or marking it with `void` is allowed.

## Incorrect

```ts
import * as v from 'valibot';

async function handle(input) {
  const result = v.safeParseAsync(SignupSchema, input);

  if (!result.success) {
    return result.issues;
  }

  v.parseAsync(AuditSchema, input);
}
```

## Correct

```ts
import * as v from 'valibot';

async function handle(input) {
  const result = await v.safeParseAsync(SignupSchema, input);

  if (!result.success) {
    return result.issues;
  }

  await v.parseAsync(AuditSchema, input);
}
```

<!-- end auto-generated rule options -->

## Autofix

No, but the rule offers an editor suggestion that adds `await` when the call is inside an `async` function or at the top level of a module.

## Further Reading

- [Valibot parseAsync() API](https://valibot.dev/api/parseAsync/)
- [Valibot safeParseAsync() API](https://valibot.dev/api/safeParseAsync/)
