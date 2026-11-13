# valibot/prefer-exact-pipe-constraint

📝 Prefer an exact length or size action over adjacent equal bounds in a Valibot pipe.

<!-- end auto-generated rule header -->

Adjacent lower and upper bounds with the same non-negative integer literal describe an exact constraint. Use `length()` for a `minLength()` and `maxLength()` pair, or `size()` for a `minSize()` and `maxSize()` pair. The rule accepts either order in `pipe()` and `pipeAsync()`.

## Incorrect

```js
import * as v from 'valibot';

const Pair = v.pipe(v.array(v.string()), v.minLength(2), v.maxLength(2));
```

## Correct

```js
import * as v from 'valibot';

const Pair = v.pipe(v.array(v.string()), v.length(2));
```

Review the messages and issue types consumed by your application before combining bounds. The exact action produces a different validation issue.

<!-- end auto-generated rule options -->
