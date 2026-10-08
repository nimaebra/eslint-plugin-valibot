# valibot/no-async-schema-in-sync-parent

📝 Disallow passing async Valibot schemas to sync schemas and parse functions, which skip their validation.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

Disallow passing async schemas such as `objectAsync()` or `pipeAsync()` to sync schemas and sync parse functions.

## Why

A sync schema cannot run an async child. Instead of failing loudly, Valibot skips the child's validation. For example, `v.safeParse(v.object({ email: AsyncEmailSchema }), { email: 'invalid' })` returns `success: true`, and the invalid field is dropped from the output. Sync `parse()` and `safeParse()` behave the same way when given an async schema.

Use the `Async` version of the parent, such as `objectAsync()`, `arrayAsync()`, `unionAsync()` or `pipeAsync()`, and validate with `parseAsync()` or `safeParseAsync()`.

The rule follows `const` bindings in the same file, so a schema declared with `pipeAsync()` and used later inside `object()` is reported too. Generic helpers such as `pick()`, `omit()`, `config()` and `message()` accept async schemas and are not reported.

## Incorrect

```ts
import * as v from 'valibot';

const EmailSchema = v.pipeAsync(
  v.string(),
  v.checkAsync(async (email) => isAvailable(email), 'Email is taken'),
);

const SignupSchema = v.object({ email: EmailSchema });

const result = v.safeParse(v.objectAsync({ email: EmailSchema }), input);
```

## Correct

```ts
import * as v from 'valibot';

const EmailSchema = v.pipeAsync(
  v.string(),
  v.checkAsync(async (email) => isAvailable(email), 'Email is taken'),
);

const SignupSchema = v.objectAsync({ email: EmailSchema });

const result = await v.safeParseAsync(SignupSchema, input);
```

<!-- end auto-generated rule options -->

## Autofix

No. Switching a parent to its async version makes it async too, so every schema and parse call that uses it has to change as well.

## Further Reading

- [Valibot async validation guide](https://valibot.dev/guides/async-validation/)
