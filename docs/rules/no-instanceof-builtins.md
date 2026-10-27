# valibot/no-instanceof-builtins

📝 Prefer native Valibot schemas over instance(Constructor) for built-in types.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

This rule encourages reviewing `instance(Constructor)` checks for built-in types and choosing a native Valibot schema when it matches the intended accepted values. Locally declared or imported constructors with built-in names are ignored.

## Why

Valibot provides dedicated schemas for standard JavaScript and TypeScript types. Their behavior is not always equivalent to `instance()`:

- `instance(Date)` accepts invalid dates; `date()` rejects them.
- `array()`, `map()`, and `set()` require schemas for their items, keys, or values. Calling them without those schemas can throw during validation.
- Using `instance(String)` checks if a value is an instance of the `String` object wrapper class (e.g. `new String()`), which is highly uncommon and usually a bug when the developer simply intended to validate standard primitive strings using `string()`.

Keep `instance()` and disable this rule where validating the built-in object instance is intentional.

### Supported Constructor Mappings

| Constructor | Preferred Valibot Schema      |
| :---------- | :---------------------------- |
| `Date`      | `date()`                      |
| `Array`     | `array(itemSchema)`           |
| `Function`  | `function()`                  |
| `Promise`   | `promise()`                   |
| `Map`       | `map(keySchema, valueSchema)` |
| `Set`       | `set(valueSchema)`            |
| `String`    | `string()`                    |
| `Number`    | `number()`                    |
| `Boolean`   | `boolean()`                   |
| `Symbol`    | `symbol()`                    |
| `BigInt`    | `bigint()`                    |
| `Blob`      | `blob()`                      |

## Incorrect

```ts
import * as v from 'valibot';

const DateSchema = v.instance(Date);
const MapSchema = v.instance(Map);
const SetSchema = v.instance(Set);
const StringSchema = v.instance(String);
```

## Correct

```ts
import * as v from 'valibot';

const DateSchema = v.date();
const MapSchema = v.map(v.string(), v.number());
const SetSchema = v.set(v.string());
const StringSchema = v.string();
```

<!-- end auto-generated rule options -->

## Autofix

This rule does not autofix because native schemas can accept different values. For zero-argument native schemas, it offers an editor suggestion only when the replacement is accessible through the existing namespace or a named import, and no comments would be removed. Applying the suggestion is an explicit choice to change validation behavior.

For `Array`, `Map`, and `Set`, choose the item/key/value schemas manually. The rule never suggests invalid zero-argument calls or inserts unbound named identifiers.

## Further Reading

- [Valibot instance() API](https://valibot.dev/api/instance/)
