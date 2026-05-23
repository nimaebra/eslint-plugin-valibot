# valibot/prefer-variant

📝 Prefer variant() over union() when object schemas share an obvious discriminant key.

⚠️ This rule _warns_ in the 🎨 `stylistic` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Prefer `variant()` over `union()` for discriminated object schema unions.

Valibot recommends using `variant()` over `union()` whenever you have a clear discriminant key for object options. This rule spots common `union([object(...)])` patterns where every object shares a literal discriminator and encourages the more explicit `variant(discriminant, options)` form.

## Why

`variant()` communicates intent directly for discriminated unions and can be easier to reason about than a generic `union()` of object schemas.

## Incorrect

```ts
import * as v from 'valibot';

const PayloadSchema = v.union([
  v.object({ type: v.literal('create'), id: v.string() }),
  v.object({ type: v.literal('update'), id: v.string() }),
]);
```

## Correct

```ts
import * as v from 'valibot';

const PayloadSchema = v.variant('type', [
  v.object({ type: v.literal('create'), id: v.string() }),
  v.object({ type: v.literal('update'), id: v.string() }),
]);
```

<!-- end auto-generated rule options -->

## Autofix

Yes, when the rule can determine an obvious shared discriminant key and a usable `variant` callee in the current import style.

## Further Reading

- [Valibot variant() API](https://valibot.dev/api/variant/)
- [Valibot union() API](https://valibot.dev/api/union/)
