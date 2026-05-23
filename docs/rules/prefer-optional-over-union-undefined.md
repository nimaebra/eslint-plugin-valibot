# valibot/prefer-optional-over-union-undefined

📝 Prefer optional() over union([schema, undefined()]) when they are equivalent.

⚠️ This rule _warns_ in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Prefer `optional()` over `union([schema, undefined()])` when they are equivalent.

## Why

`optional()` is the Valibot wrapper meant for schemas that accept `undefined`. It is shorter, clearer, and communicates intent better than a two-member `union()` with `undefined()`.

This rule stays conservative and does not report object-entry schemas or unions with custom messages, because those forms can have different behavior from `optional()`.

## Incorrect

```ts
import * as v from 'valibot';

const Schema = v.union([v.string(), v.undefined()]);
```

## Correct

```ts
import * as v from 'valibot';

const Schema = v.optional(v.string());
```

<!-- end auto-generated rule options -->

## Autofix

Yes, when the existing import style already provides an `optional` callee and the union form is behaviorally equivalent.

## Further Reading

- [Valibot optional() API](https://valibot.dev/api/optional/)
- [Valibot union() API](https://valibot.dev/api/union/)
- [Valibot undefined() API](https://valibot.dev/api/undefined/)
