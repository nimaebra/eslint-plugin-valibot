# valibot/no-redundant-schema-wrappers

📝 Disallow redundant nested Valibot schema wrappers.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Disallow redundant nested Valibot wrappers such as `optional(optional(schema))`.

## Why

Repeated wrappers add noise and usually do not change the schema behavior. They often appear during refactors or wrapper composition changes.

## Incorrect

```ts
import * as v from 'valibot';

const Schema = v.optional(v.optional(v.string()));
```

## Correct

```ts
import * as v from 'valibot';

const Schema = v.optional(v.string());
```

<!-- end auto-generated rule options -->

## Autofix

Yes, when both wrappers are identical and neither wrapper uses a default argument.
