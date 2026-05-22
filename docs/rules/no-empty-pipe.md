# valibot/no-empty-pipe

📝 Disallow empty pipe() calls or pipe() calls with a single argument.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

This rule ensures that `pipe()` calls are only used when chaining validation or transformation actions onto a base schema. It flags empty pipes or pipes containing only a single schema argument.

## Why

In Valibot, `pipe()` is used to connect a base schema with validation or transformation actions (e.g. `pipe(string(), nonEmpty(), trim())`).
- Calling `pipe()` with no arguments is an invalid operation that triggers an error at runtime or compile-time.
- Calling `pipe(string())` with only a single schema is redundant. It introduces unnecessary function calls and object allocation at runtime without adding any validation or transformation behavior. It should be simplified directly to `string()`.

## Incorrect

```ts
import { pipe, string } from 'valibot';

// Empty pipe call
const EmptySchema = pipe();

// Redundant pipe call with a single argument
const RedundantSchema = pipe(string());
```

## Correct

```ts
import { pipe, string, email, trim } from 'valibot';

// Simplified schema without redundant pipe
const SimplifiedSchema = string();

// Correct pipeline usage
const PipedSchema = pipe(string(), email(), trim());
```

<!-- end auto-generated rule options -->

## Autofix

Yes, this rule automatically rewrites single-argument pipes to extract the inner schema (e.g., `pipe(string())` becomes `string()`).
