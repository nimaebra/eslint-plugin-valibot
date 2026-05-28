# valibot/no-redundant-transformation

📝 Disallow redundant manual transformations that duplicate built-in Valibot actions.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

This rule detects manual `transform()` calls that wrap simple string methods already provided as built-in Valibot actions, and suggests using the native action instead.

## Why

Valibot provides dedicated, optimized built-in actions for common string transformations. Using `transform((val) => val.toLowerCase())` instead of the built-in `toLowerCase()` action results in:

- Larger bundle sizes due to the extra transform wrapper
- Less readable code
- Missed optimization opportunities from Valibot's native implementations

## Supported Mappings

| Manual Transform              | Preferred Valibot Action |
| :---------------------------- | :----------------------- |
| `val.toLowerCase()`           | `toLowerCase()`          |
| `val.toLocaleLowerCase()`     | `toLowerCase()`          |
| `val.toUpperCase()`           | `toUpperCase()`          |
| `val.toLocaleUpperCase()`     | `toUpperCase()`          |
| `val.trim()`                  | `trim()`                 |
| `val.trimStart()`             | `trimStart()`            |
| `val.trimEnd()`               | `trimEnd()`              |
| `val.normalize()`             | `normalize()`            |
| `val.toWellFormed()`          | `toWellFormed()`         |

## Incorrect

```ts
import * as v from 'valibot';

const SlugSchema = v.pipe(
  v.string(),
  v.transform((val) => val.toLowerCase()),
);

const CleanSchema = v.pipe(
  v.string(),
  v.transform((val) => val.trim()),
);
```

## Correct

```ts
import * as v from 'valibot';

const SlugSchema = v.pipe(v.string(), v.toLowerCase());

const CleanSchema = v.pipe(v.string(), v.trim());
```

<!-- end auto-generated rule options -->

## Autofix

Yes, this rule is fully autofixable. It replaces the entire `transform()` call with the equivalent built-in action call, preserving the correct import style (namespace or named).

## Further Reading

- [Valibot transform() API](https://valibot.dev/api/transform/)
- [Valibot toLowerCase() API](https://valibot.dev/api/toLowerCase/)
- [Valibot toUpperCase() API](https://valibot.dev/api/toUpperCase/)
- [Valibot trim() API](https://valibot.dev/api/trim/)
- [Valibot trimStart() API](https://valibot.dev/api/trimStart/)
- [Valibot trimEnd() API](https://valibot.dev/api/trimEnd/)
- [Valibot normalize() API](https://valibot.dev/api/normalize/)
- [Valibot toWellFormed() API](https://valibot.dev/api/toWellFormed/)
