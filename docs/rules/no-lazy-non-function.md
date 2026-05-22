# valibot/no-lazy-non-function

📝 Disallow passing a direct schema or non-function value to lazy().

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

This rule ensures that any call to `lazy()` receives a function returning a schema rather than a directly evaluated schema or other values.

## Why

In Valibot, the `lazy` schema is used to define recursive or mutually recursive schemas. To do this without creating immediate circular dependency or evaluation errors, `lazy()` defers schema compilation by accepting a function returning a schema (e.g., `(() => Schema)`).

Passing a schema directly to `lazy()` (e.g., `lazy(string())`) evaluates the schema immediately, which defeats the lazy evaluation and can result in a `ReferenceError` or call-stack size limit exceeded failures at module load time.

## Incorrect

```ts
import { lazy, string } from 'valibot';

// Direct schema call evaluated immediately
const Schema = lazy(string());
```

## Correct

```ts
import { lazy, string } from 'valibot';

// Deferred evaluation via arrow function
const Schema = lazy(() => string());
```

<!-- end auto-generated rule options -->

## Autofix

No.
