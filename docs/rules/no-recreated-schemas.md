# valibot/no-recreated-schemas

📝 Disallow recreating static Valibot schemas inside function scope.

⚠️ This rule _warns_ in the 🔒 `strict` config.

<!-- end auto-generated rule header -->

Disallow recreating static Valibot schemas inside function scope.

## Why

Static schemas can usually be hoisted to module scope. Recreating them inside frequently called functions adds avoidable work and makes it less obvious which validators are shared.

That includes both assigning a schema to a local variable and returning a static schema expression directly from a function.

## Incorrect

```ts
import * as v from 'valibot';

function createSchema() {
  return v.object({ name: v.string() });
}
```

## Correct

```ts
import * as v from 'valibot';

const UserSchema = v.object({ name: v.string() });

function validate(input: unknown) {
  return v.safeParse(UserSchema, input);
}
```

Dynamic schema factories that genuinely depend on runtime inputs can stay inside a function.

<!-- end auto-generated rule options -->

## Autofix

No.
