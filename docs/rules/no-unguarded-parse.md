# valibot/no-unguarded-parse

📝 Require Valibot parse(), assert() and parseAsync() calls to be guarded against validation errors.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

Require `parse()`, `assert()` and `parseAsync()` calls to be guarded against validation errors.

A call counts as guarded when it sits inside the `try` block of a `try/catch`. A `try/finally` without `catch` does not count, because the error still escapes. A `parseAsync()` call also counts as guarded when its promise has a rejection handler through `.catch(handler)` or `.then(onFulfilled, onRejected)`.

## Why

Valibot `parse()` and `assert()` throw when validation fails, and `parseAsync()` rejects. In recoverable flows, code should catch those failures explicitly or use the non-throwing alternatives: `safeParse()`, `is()` or `safeParseAsync()`.

## Incorrect

```ts
import * as v from 'valibot';

const value = v.parse(v.string(), input);

const user = v.parseAsync(UserSchema, input);
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

const result = v.safeParse(v.string(), input);

const user = v.parseAsync(UserSchema, input).catch(() => null);
```

## Options

```json
{
  "allowAtModuleScope": false,
  "allowInFunctions": [],
  "functions": ["parse", "assert", "parseAsync"]
}
```

### `allowAtModuleScope`

Default: `false`

Allow unguarded calls outside of any function. Throwing at startup is often intended, for example when validating environment variables so the process fails fast:

```js
// eslint valibot/no-unguarded-parse: ["error", { "allowAtModuleScope": true }]
import * as v from 'valibot';

export const env = v.parse(EnvSchema, process.env);
```

### `allowInFunctions`

Default: `[]`

Allow unguarded calls inside functions with these names, when a framework already turns thrown errors into responses. For example, Remix and React Router `loader`/`action` functions:

```js
// eslint valibot/no-unguarded-parse: ["error", { "allowInFunctions": ["loader", "action"] }]
import * as v from 'valibot';

export async function action({ request }) {
  const data = v.parse(
    FormSchema,
    Object.fromEntries(await request.formData()),
  );
  return save(data);
}
```

A function's name comes from its declaration, the variable it is assigned to, or its object or class key. Every enclosing named function is checked, so a call inside an anonymous callback within `action` is allowed too.

### `functions`

Default: `["parse", "assert", "parseAsync"]`

Which throwing Valibot functions to check. Remove `parseAsync` to keep this rule's behavior from before `parseAsync()` support was added.

<!-- end auto-generated rule options -->

## Autofix

No. This rule does not provide autofix because introducing try/catch boundaries or switching to `safeParse()` requires flow-specific error handling decisions.

## Further Reading

- [Valibot parse() API](https://valibot.dev/api/parse/)
- [Valibot assert() API](https://valibot.dev/api/assert/)
- [Valibot parseAsync() API](https://valibot.dev/api/parseAsync/)
- [Valibot safeParse() API](https://valibot.dev/api/safeParse/)
- [Valibot safeParseAsync() API](https://valibot.dev/api/safeParseAsync/)
- [Valibot is() API](https://valibot.dev/api/is/)
