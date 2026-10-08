# valibot/no-length-check-before-trim

📝 Disallow minimum length and emptiness checks before trim() in the same pipe, where whitespace can satisfy them.

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Disallow minimum length and emptiness checks that run before `trim()`, `trimStart()` or `trimEnd()` in the same `pipe()` or `pipeAsync()`.

Checked actions: `nonEmpty()`, `minLength()`, `length()`, `minGraphemes()`, `graphemes()`, `minWords()`, `words()`, `minBytes()`, `bytes()`, `minCodePoints()` and `codePoints()`.

## Why

Pipe actions run in order. A check placed before `trim()` validates the untrimmed input, so whitespace can satisfy it. For example, `"   "` passes `nonEmpty()` and then becomes `""`, so an empty string gets through a schema that looks like it rejects one.

Upper bounds such as `maxLength()` are not reported. Checking them before trimming is stricter, and is a common way to cap the size of raw input.

## Incorrect

```ts
import * as v from 'valibot';

const NameSchema = v.pipe(v.string(), v.nonEmpty(), v.trim());

const CommentSchema = v.pipe(v.string(), v.minLength(10), v.trimEnd());
```

## Correct

```ts
import * as v from 'valibot';

const NameSchema = v.pipe(v.string(), v.trim(), v.nonEmpty());

const CommentSchema = v.pipe(
  v.string(),
  v.maxLength(10_000),
  v.trimEnd(),
  v.minLength(10),
);
```

<!-- end auto-generated rule options -->

## Autofix

No, but the rule offers an editor suggestion that moves the trim action in front of the first reported check. It is a suggestion rather than an autofix because it changes which inputs the schema accepts. No suggestion is offered when the pipe contains comments.

## Further Reading

- [Valibot pipe() API](https://valibot.dev/api/pipe/)
- [Valibot trim() API](https://valibot.dev/api/trim/)
