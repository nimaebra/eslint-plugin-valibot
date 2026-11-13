# valibot/no-object-reshape-after-pipe

📝 Disallow reshaping a Valibot object schema after it has been piped.

<!-- end auto-generated rule header -->

Reshaping a piped object can change its declared entries while parsing still uses the original schema. Apply `pick()`, `omit()`, `partial()`, or `required()` to the base object, then add compatible checks and transformations. Review any checks that refer to fields affected by the reshape.

## Incorrect

```js
import * as v from 'valibot';

const User = v.object({ name: v.string(), admin: v.boolean() });
const CheckedUser = v.pipe(
  User,
  v.check((user) => user.name.length > 0),
);
const Name = v.pick(CheckedUser, ['name']);
```

## Correct

```js
import * as v from 'valibot';

const User = v.object({ name: v.string(), admin: v.boolean() });
const Name = v.pipe(
  v.pick(User, ['name']),
  v.check((user) => user.name.length > 0),
);
```

The rule follows local `const` aliases and nested `pipe()` or `pipeAsync()` calls rooted in a Valibot object constructor. One-argument and metadata-only pipes count. It also covers `partialAsync()` and `requiredAsync()`.

<!-- end auto-generated rule options -->
