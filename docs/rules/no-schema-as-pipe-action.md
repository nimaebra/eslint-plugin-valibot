# valibot/no-schema-as-pipe-action

📝 Ensure the first argument of pipe() is a schema and subsequent arguments are actions.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

This rule enforces the expected shape of Valibot `pipe()` calls: the first argument must be a base schema such as `string()` or `number()`, and every following argument must be a validation or transformation action such as `email()` or `trim()`.

It reports both of these mistakes:

- passing a schema where a pipe action should be used
- passing a validation or transformation action as the first argument

## Why

In Valibot, `pipe()` builds on top of a base schema. The first argument defines the schema being validated, and the remaining arguments refine or transform its value.

Mixing those roles makes the pipeline incorrect and harder to understand. For example, `pipe(string(), number())` places a second schema where an action is expected, while `pipe(email(), string())` starts the pipeline with an action that has no base schema to operate on. This rule catches those mistakes early and keeps `pipe()` usage consistent and readable.

## Incorrect

```ts
import { pipe, string, number, email } from 'valibot';

const InvalidSchemaAction = pipe(string(), number());
const InvalidFirstArgument = pipe(email(), string());
```

## Correct

```ts
import { pipe, string, email, trim } from 'valibot';

const Schema = pipe(string(), email(), trim());
```

<!-- end auto-generated rule options -->

## Autofix

No.
