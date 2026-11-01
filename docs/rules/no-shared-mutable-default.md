# valibot/no-shared-mutable-default

📝 Disallow mutable default values that are shared across Valibot parses.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Use a factory when a mutable default is returned by reference across parses. Sharing an array, object, or `Date` allows mutations from one parse result to affect later results.

This rule is opt-in and is also enabled by `all`. It is not included in `recommended`, `strict`, or `stylistic`.

## Incorrect

```ts
import * as v from 'valibot';

const ItemsSchema = v.optional(v.unknown(), []);
const CreatedAtSchema = v.optional(v.date(), new Date());
```

## Correct

```ts
import * as v from 'valibot';

const ItemsSchema = v.optional(v.unknown(), () => []);
const CreatedAtSchema = v.optional(v.date(), () => new Date());
```

<!-- end auto-generated rule options -->

## Scope

Checks direct array/object literals and built-in `new Date()` defaults in `optional`, `nullable`, `nullish`, `undefinedable`, and `exactOptional`, including async variants. It reports only when the directly wrapped schema is `any`, `unknown`, or `date` and can retain the value's identity. Array and object schemas normally create a new output container and are left alone. Schema identifiers, pipes, default identifiers, custom constructors, factories, and primitive defaults are not analyzed.

## Suggestions

The editor can wrap the default in a factory. This changes when allocation and any expressions inside the default run. Review that timing, especially for dates and object properties with side effects. The rule provides a suggestion rather than an automatic fix.

## Further Reading

- [Valibot optional() API](https://valibot.dev/api/optional/)
