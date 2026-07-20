# valibot/no-single-member-union

📝 Disallow Valibot union() calls with only one schema option.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Disallow Valibot `union()` calls with only one schema option.

## Why

`union([schema])` is equivalent to `schema` and adds unnecessary runtime work. Use the inner schema directly.

## Incorrect

```ts
import * as v from 'valibot';

const SingleMemberUnionSchema = v.union([v.string()]);
```

## Correct

```ts
import * as v from 'valibot';

const StringSchema = v.string();
```

<!-- end auto-generated rule options -->

## Autofix

Yes, when the union has no extra arguments. If the union has a custom issue message, the rule still reports it but leaves the fix to you so the message is not accidentally discarded.

## Further Reading

- [Valibot union() API](https://valibot.dev/api/union/)
