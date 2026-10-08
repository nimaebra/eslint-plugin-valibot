# valibot/no-duplicate-pipe-actions

📝 Disallow duplicate Valibot actions inside the same pipe() call.

⚠️ This rule _warns_ in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Disallow duplicate Valibot actions inside the same `pipe()` call.

## Why

Repeated actions such as `trim(), trim()` or `minLength(1), minLength(1)` add noise and usually indicate dead validation steps that survived a refactor.

## Incorrect

```ts
import * as v from 'valibot';

const Schema = v.pipe(v.string(), v.trim(), v.trim(), v.minLength(1));
```

## Correct

```ts
import * as v from 'valibot';

const Schema = v.pipe(v.string(), v.trim(), v.minLength(1));
```

<!-- end auto-generated rule options -->

## Async APIs

The rule also checks `pipeAsync()`. Keep one copy of each equivalent action:

```ts
import * as v from 'valibot';

const DuplicateSchema = v.pipeAsync(v.string(), v.minLength(3), v.minLength(3));
const Schema = v.pipeAsync(v.string(), v.minLength(3));
```

## Autofix

Yes, when the duplicated action is an exact repeated call and removing the later call does not cross nearby comments.

## Further Reading

- [Valibot pipe() API](https://valibot.dev/api/pipe/)
