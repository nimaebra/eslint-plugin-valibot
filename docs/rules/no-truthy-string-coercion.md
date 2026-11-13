# valibot/no-truthy-string-coercion

📝 Disallow coercing Valibot string inputs to booleans using JavaScript truthiness.

<!-- end auto-generated rule header -->

JavaScript boolean coercion turns every non-empty string into `true`, including `'false'`, `'0'`, and `'no'`. This rule reports `toBoolean()` and `transform(Boolean)` in pipelines where the input to that action is known to be a string. It follows local `const` aliases and stops when an action might change the input type.

## Incorrect

```js
import * as v from 'valibot';

const Enabled = v.pipe(v.string(), v.trim(), v.toBoolean());
```

## Correct

```js
import * as v from 'valibot';

const Enabled = v.pipe(
  v.picklist(['true', 'false']),
  v.transform((value) => value === 'true'),
);
```

Valibot 1.3 and later also offer `parseBoolean()` for configurable boolean strings.

<!-- end auto-generated rule options -->
