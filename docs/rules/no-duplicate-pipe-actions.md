# valibot/no-duplicate-pipe-actions

📝 Disallow consecutive duplicate idempotent Valibot actions inside pipe() calls.

⚠️ This rule _warns_ in the following configs: ✅ `recommended`, 🔒 `strict`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Disallow duplicate Valibot actions inside the same `pipe()` call.

## Why

Consecutive idempotent actions such as `trim(), trim()` or `minLength(1), minLength(1)` add noise and usually indicate dead validation steps that survived a refactor. Repeated transformations and callbacks can be intentional and are not considered duplicates.

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

The rule also checks `pipeAsync()`. Keep one copy of each consecutive equivalent idempotent action:

```ts
import * as v from 'valibot';

const DuplicateSchema = v.pipeAsync(v.string(), v.minLength(3), v.minLength(3));
const Schema = v.pipeAsync(v.string(), v.minLength(3));
```

## Autofix

The rule only reports exact, consecutive calls to a conservative set of known idempotent actions with literal arguments. It covers `trim`, `trimStart`, `trimEnd`, `toLowerCase`, `toUpperCase`, `normalize`, `length`, `minLength`, `maxLength`, `nonEmpty`, `size`, `minSize`, `maxSize`, `value`, `minValue`, `maxValue`, `multipleOf`, `integer`, `safeInteger`, and `finite`.

It does not report arbitrary `transform()`/`transformAsync()` calls, custom checks, regular expressions, dynamic arguments, or actions separated by another pipe item. Even `trim()` may be needed again after an intervening transformation:

```ts
const Schema = v.pipe(
  v.string(),
  v.trim(),
  v.transform((value) => value + ' '),
  v.trim(),
);
```

The fix removes the later call when doing so does not cross nearby comments. Removing a repeated validation also removes its duplicate issue on invalid input; keep both validations, or disable the rule for that line, if that issue count is intentional.

## Further Reading

- [Valibot pipe() API](https://valibot.dev/api/pipe/)
