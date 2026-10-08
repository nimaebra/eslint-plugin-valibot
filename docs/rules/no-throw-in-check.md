# valibot/no-throw-in-check

📝 Disallow throwing inside Valibot check and transform callbacks, which escapes safeParse().

💼 This rule is enabled in the following configs: ✅ `recommended`, 🔒 `strict`.

<!-- end auto-generated rule header -->

Disallow `throw` inside the callbacks of Valibot check and transform actions: `check()`, `checkItems()`, `partialCheck()`, `rawCheck()`, `custom()`, `guard()`, `transform()`, `rawTransform()`, and their async variants.

## Why

Valibot does not catch errors thrown by these callbacks. A `throw` escapes `safeParse()`, which is meant to never throw, and crashes the caller instead of producing a validation issue. It also skips the rest of the pipeline, so other issues are never collected.

Return `false` from a check to report an issue, or use `rawCheck()` and `rawTransform()` and call `addIssue()`.

Throws inside nested helper functions are ignored, and so are throws caught by a `try/catch` inside the callback.

## Incorrect

```ts
import * as v from 'valibot';

const UsernameSchema = v.pipe(
  v.string(),
  v.check((value) => {
    if (reserved.has(value)) throw new Error('Username is taken');
    return true;
  }),
);

const JsonSchema = v.pipe(
  v.string(),
  v.transform((value) => JSON.parse(value)),
  v.rawTransform(({ dataset }) => {
    if (!dataset.value) throw new Error('Empty JSON');
    return dataset.value;
  }),
);
```

## Correct

```ts
import * as v from 'valibot';

const UsernameSchema = v.pipe(
  v.string(),
  v.check((value) => !reserved.has(value), 'Username is taken'),
);

const JsonSchema = v.pipe(
  v.string(),
  v.parseJson(),
  v.rawTransform(({ dataset, addIssue, NEVER }) => {
    if (!dataset.value) {
      addIssue({ message: 'Empty JSON' });
      return NEVER;
    }
    return dataset.value;
  }),
);
```

<!-- end auto-generated rule options -->

## Autofix

No. Replacing a `throw` with a return value or `addIssue()` call depends on the callback's logic.

## Further Reading

- [Valibot check() API](https://valibot.dev/api/check/)
- [Valibot rawCheck() API](https://valibot.dev/api/rawCheck/)
- [Valibot rawTransform() API](https://valibot.dev/api/rawTransform/)
