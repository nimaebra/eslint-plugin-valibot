# valibot/no-redundant-transformation

📝 Disallow redundant Valibot transform() actions.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

This rule detects redundant `transform()` usage in pipes:

- manual wrappers around built-in string actions such as `toLowerCase()`
- identity transforms that return the input unchanged

## Why

Valibot provides dedicated, optimized built-in actions for common string transformations. Using `transform((val) => val.toLowerCase())` instead of the built-in `toLowerCase()` action results in:

- Larger bundle sizes due to the extra transform wrapper
- Less readable code
- Missed optimization opportunities from Valibot's native implementations

## Supported Mappings

| Manual Transform    | Preferred Valibot Action |
| :------------------ | :----------------------- |
| `val.toLowerCase()` | `toLowerCase()`          |
| `val.toUpperCase()` | `toUpperCase()`          |
| `val.trim()`        | `trim()`                 |
| `val.trimStart()`   | `trimStart()`            |
| `val.trimEnd()`     | `trimEnd()`              |
| `val.normalize()`   | `normalize()`            |

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

const IdentitySchema = v.pipe(
  v.string(),
  v.transform((val) => val),
);
```

## Correct

```ts
import * as v from 'valibot';

const SlugSchema = v.pipe(v.string(), v.toLowerCase());

const CleanSchema = v.pipe(v.string(), v.trim());

const IdentitySchema = v.string();
```

<!-- end auto-generated rule options -->

## Autofix

The rule replaces a `transform()` call when a safe equivalent exists. Identity transforms are reported without a fix when removing them would also remove a comment.

## Further Reading

- [Valibot transform() API](https://valibot.dev/api/transform/)
- [Valibot toLowerCase() API](https://valibot.dev/api/toLowerCase/)
- [Valibot toUpperCase() API](https://valibot.dev/api/toUpperCase/)
- [Valibot trim() API](https://valibot.dev/api/trim/)
- [Valibot trimStart() API](https://valibot.dev/api/trimStart/)
- [Valibot trimEnd() API](https://valibot.dev/api/trimEnd/)
- [Valibot normalize() API](https://valibot.dev/api/normalize/)
