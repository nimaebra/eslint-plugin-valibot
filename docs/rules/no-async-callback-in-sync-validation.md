# valibot/no-async-callback-in-sync-validation

📝 Disallow async callbacks in synchronous Valibot validation and transformation APIs.

<!-- end auto-generated rule header -->

Synchronous Valibot APIs do not await their callbacks. For example, `check(async () => false)` sees a truthy promise and can accept invalid input. A synchronous `transform()` can also put a promise into the parsed output. Using a synchronous action inside `pipeAsync()` still leaves the action responsible for awaiting its callback.

## Incorrect

```js
import * as v from 'valibot';

const Schema = v.pipeAsync(
  v.string(),
  v.check(async () => false),
);
```

## Correct

```js
import * as v from 'valibot';

const Schema = v.pipeAsync(
  v.string(),
  v.checkAsync(async () => false),
);
```

The rule checks explicitly async callbacks in `check()`, `checkItems()`, `partialCheck()`, `custom()`, `rawCheck()`, `rawTransform()`, `transform()`, `everyItem()`, `someItem()`, and `guard()`. It follows local function declarations and `const` aliases. For `everyItem()`, `someItem()`, and `guard()`, use a synchronous callback or move the async logic to an async validation action.

<!-- end auto-generated rule options -->
