# valibot/no-instanceof-builtins

📝 Prefer primitive schema functions over instance(Constructor) for built-in types.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

This rule encourages the use of highly optimized, native Valibot primitive schemas (like `date()`, `map()`, etc.) instead of checking built-in types via the general `instance(Constructor)` schema.

## Why

Valibot provides dedicated, lightweight, and highly optimized schema functions for standard JavaScript and TypeScript built-in objects.
- Using `instance(Date)` is less optimized and less specific than using the native `date()` schema.
- Using `instance(Array)` is slower and less versatile than the standard `array()` schema.
- Using `instance(String)` checks if a value is an instance of the `String` object wrapper class (e.g. `new String()`), which is highly uncommon and usually a bug when the developer simply intended to validate standard primitive strings using `string()`.

By utilizing Valibot's dedicated primitive schemas, you gain better performance, smaller bundle sizes, and clearer validation code.

### Supported Constructor Mappings

| Constructor | Preferred Valibot Schema |
| :--- | :--- |
| `Date` | `date()` |
| `Array` | `array()` |
| `Function` | `function()` |
| `Promise` | `promise()` |
| `Map` | `map()` |
| `Set` | `set()` |
| `String` | `string()` |
| `Number` | `number()` |
| `Boolean` | `boolean()` |
| `Symbol` | `symbol()` |
| `BigInt` | `bigint()` |
| `Blob` | `blob()` |

## Incorrect

```ts
import { instance } from 'valibot';

const DateSchema = instance(Date);
const MapSchema = instance(Map);
const SetSchema = instance(Set);
const StringSchema = instance(String);
```

## Correct

```ts
import { date, map, set, string } from 'valibot';

const DateSchema = date();
const MapSchema = map();
const SetSchema = set();
const StringSchema = string();
```

<!-- end auto-generated rule options -->

## Autofix

Yes, this rule is fully autofixable.
