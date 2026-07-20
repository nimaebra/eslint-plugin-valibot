# valibot/prefer-flatten-pipe

📝 Prefer a single flattened pipe() call over nested pipe() calls.

⚠️ This rule _warns_ in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Prefer a single flattened `pipe()` call over nested `pipe()` calls.

## Why

Nested pipes such as `pipe(pipe(string(), trim()), minLength(1))` are harder to read and behave the same as a single flattened pipe with all arguments in order.

## Incorrect

```ts
import * as v from 'valibot';

const NestedPipeSchema = v.pipe(v.pipe(v.string(), v.trim()), v.minLength(1));
```

## Correct

```ts
import * as v from 'valibot';

const FlattenedPipeSchema = v.pipe(v.string(), v.trim(), v.minLength(1));
```

<!-- end auto-generated rule options -->

## Autofix

Yes, unless a nested `pipe()` contains a spread argument or the expression contains comments. The rule still reports those cases, but avoids autofixing when it cannot preserve source text safely.

## Further Reading

- [Valibot pipe() API](https://valibot.dev/api/pipe/)
