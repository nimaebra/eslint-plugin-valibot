# valibot/prefer-picklist

📝 Prefer picklist() over union() when the union only contains literal string schemas.

⚠️ This rule _warns_ in the 🎨 `stylistic` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Prefer `picklist()` over `union()` when all options are literal string schemas.

Valibot provides `picklist()` specifically for fixed lists of values. This rule detects `union([literal(...), literal(...)])` shapes with string literals and recommends the simpler `picklist([...])` form.

## Why

`picklist()` is purpose-built for value lists, tends to read more clearly, and avoids repetitive `literal()` wrappers for simple string options.

## Incorrect

```ts
import * as v from 'valibot';

const StatusSchema = v.union([
  v.literal('active'),
  v.literal('inactive'),
  v.literal('archived'),
]);
```

## Correct

```ts
import * as v from 'valibot';

const StatusSchema = v.picklist(['active', 'inactive', 'archived']);
```

<!-- end auto-generated rule options -->

## Async APIs

String-literal unions are also recognized in `unionAsync()`. The replacement is the synchronous `picklist()`, which can also be used by async parents and parsing APIs:

```ts
import * as v from 'valibot';

const UnionSchema = v.unionAsync([v.literal('admin'), v.literal('user')]);
const Schema = v.picklist(['admin', 'user']);
```

## Autofix

Yes, when the union options are all literal string schemas and a usable `picklist` callee is available in the current import style.

## Further Reading

- [Valibot picklist() API](https://valibot.dev/api/picklist/)
- [Valibot union() API](https://valibot.dev/api/union/)
