# valibot/prefer-nullable-over-union-null

📝 Prefer nullable() over union([schema, null()]) when they are equivalent.

⚠️ This rule _warns_ in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Prefer `nullable()` over `union([schema, null()])` when they are equivalent.

## Why

`nullable()` is the Valibot wrapper meant for schemas that accept `null`. It is shorter, clearer, and communicates intent better than a two-member `union()` with `null()`.

This rule stays conservative and does not report object-entry schemas or unions with custom messages, because those forms can have different behavior from `nullable()`.

## Incorrect

```ts
import * as v from 'valibot';

const Schema = v.union([v.string(), v.null()]);
```

## Correct

```ts
import * as v from 'valibot';

const Schema = v.nullable(v.string());
```

<!-- end auto-generated rule options -->

## Autofix

Yes, when the existing import style already provides a `nullable` callee and the union form is behaviorally equivalent.
