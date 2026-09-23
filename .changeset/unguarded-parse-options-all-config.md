---
'eslint-plugin-valibot': minor
---

Add an `all` config (`flatConfigs.all` and `plugin:valibot/all`) that enables every rule as an error. New rules join it in minor releases.

`no-unguarded-parse` changes:

- Now checks `parseAsync()`. A `.catch(handler)` or `.then(onFulfilled, onRejected)` rejection handler counts as a guard.
- No longer treats `try/finally` without a `catch` clause as a guard, because the error still escapes.
- New options:
  - `allowAtModuleScope`: allow fail-fast validation at the top level.
  - `allowInFunctions`: allow calls inside named functions whose errors a framework handles, such as `loader` or `action`.
  - `functions`: choose which of `parse`, `assert` and `parseAsync` to check.
- The report message now suggests the matching non-throwing alternative: `safeParse()`, `is()` or `safeParseAsync()`.

Also exports a new `PresetName` type.
