# valibot/no-loose-object

📝 Disallow disallowed Valibot object schema constructors such as looseObject().

⚠️ This rule _warns_ in the 🔒 `strict` config.

<!-- end auto-generated rule header -->

Require consistent use of Valibot object schema constructors.

By default, this rule allows `object()` and `strictObject()` and disallows `looseObject()`. You can customize the allowed constructors with the `allow` option if your codebase wants a different object parsing policy.

## Why

Different Valibot object constructors have different behavior for unknown keys:

- `object()` strips them.
- `strictObject()` rejects them.
- `looseObject()` preserves them.

Mixing those semantics casually makes schema behavior harder to reason about, and `looseObject()` can be especially risky when parsed objects are passed into authorization, persistence, or mass-assignment sensitive code.

## Incorrect

```ts
import * as v from 'valibot';

const UserSchema = v.looseObject({
  role: v.string(),
});
```

## Correct

```ts
import * as v from 'valibot';

const UserSchema = v.object({
  role: v.string(),
});
```

## Options

```json
{
  "allow": ["object", "strictObject"]
}
```

Default: `['object', 'strictObject']`

If you want to ban `strictObject()` too, configure the rule like this:

```json
{
  "rules": {
    "valibot/no-loose-object": ["warn", { "allow": ["object"] }]
  }
}
```

With that configuration, `strictObject()` becomes invalid as well.

<!-- end auto-generated rule options -->

## Autofix

No. This rule does not provide autofix because swapping object constructor semantics (`object`, `strictObject`, `looseObject`) can change runtime behavior for unknown keys.

## Further Reading

- [Valibot object() API](https://valibot.dev/api/object/)
- [Valibot strictObject() API](https://valibot.dev/api/strictObject/)
- [Valibot looseObject() API](https://valibot.dev/api/looseObject/)
