---
'eslint-plugin-valibot': patch
---

Fix rule documentation links, which pointed to a non-existent GitHub account and returned 404 in editors and ESLint output.

Recognize Valibot imported from JSR (`@valibot/valibot`) and through Deno `npm:`/`jsr:` specifiers. Previously every rule ignored these files.

Catch up with Valibot 1.2 to 1.5 APIs:

- `require-issue-messages` now covers `ksuid()`, `codePoints()`, `minCodePoints()`, `maxCodePoints()` and `notCodePoints()`, and reports `required(schema, [keys])` calls without a message instead of mistaking the keys array for one.
- `no-async-action-in-sync-pipe` now reports `partialCheckAsync()`.
- Schema-aware rules such as `no-recreated-schemas` now recognize `cache()`, `config()` and `keyof()`.
- All rules treat the reserved-word aliases `null_()`, `undefined_()`, `void_()`, `enum_()` and `function_()` like their canonical names.
