# eslint-plugin-valibot

## 1.4.0

### Minor Changes

- 1f90774: Apply rules to Valibot's async APIs. Previously most rules only matched the sync names, so async schemas were silently skipped.

  - `no-empty-pipe`, `no-duplicate-pipe-actions`, `no-conflicting-pipe-actions`, `prefer-flatten-pipe` and `no-redundant-transformation` now check `pipeAsync()`. `prefer-flatten-pipe` flattens sync and async inner pipes into an outer `pipeAsync()`.
  - `no-empty-union`, `no-single-member-union`, `prefer-picklist`, `prefer-variant`, `prefer-nullable-over-union-null` and `prefer-optional-over-union-undefined` now check `unionAsync()`. Autofixes keep the async API, e.g. `unionAsync([schema, null()])` becomes `nullableAsync(schema)`.
  - `no-redundant-schema-wrappers` and `prefer-nullish` now check `optionalAsync()`, `nullableAsync()` and the other async wrappers.
  - `no-loose-object` now checks `looseObjectAsync()`.
  - `no-transform-in-record-key` now checks `recordAsync()`, `pipeAsync()`, `transformAsync()` and `rawTransformAsync()`.
  - `no-recreated-schemas`, `no-schema-as-type` and the schema naming rules now recognize async schema constructors such as `objectAsync()`.

- ced9aa4: Add five correctness rules, enabled as errors in `recommended` and `strict`:

  - `no-throw-in-check`: disallows `throw` inside `check()`, `transform()`, `rawCheck()` and similar callbacks, because Valibot does not catch it and it escapes `safeParse()`.
  - `no-length-check-before-trim`: disallows `nonEmpty()`, `minLength()` and similar lower-bound checks before `trim()` in the same pipe, where whitespace-only input can pass them. Offers a suggestion to move the trim.
  - `no-unchecked-safe-parse`: requires checking `success` before reading `output` from `safeParse()`, since `output` holds the unvalidated input on failure.
  - `no-async-schema-in-sync-parent`: disallows async schemas inside sync schemas or sync parse calls. In that case Valibot skips the async child's validation and reports success.
  - `no-unawaited-parse-async`: disallows reading `.success`, `.output` or other result properties from an un-awaited `parseAsync()` or `safeParseAsync()` promise, and disallows discarding the promise. Offers an `await` suggestion.

- d11dcac: Add an `all` config (`flatConfigs.all` and `plugin:valibot/all`) that enables every rule as an error. New rules join it in minor releases.

  `no-unguarded-parse` changes:

  - Now checks `parseAsync()`. A `.catch(handler)` or `.then(onFulfilled, onRejected)` rejection handler anywhere in its promise chain counts as a guard. Missing handlers and known non-function values such as `undefined` and `null` do not count.
  - A `parseAsync()` promise must be awaited inside `try/catch` to count as guarded. Returning it without `await` still lets its rejection escape. Guards do not cross function boundaries.
  - No longer treats `try/finally` without a `catch` clause as a guard, because the error still escapes.
  - New options:
    - `allowAtModuleScope`: allow fail-fast validation at the top level.
    - `allowInFunctions`: allow calls inside named functions whose errors a framework handles, such as `loader` or `action`.
    - `functions`: choose which of `parse`, `assert` and `parseAsync` to check.
  - The report message now suggests the matching non-throwing alternative: `safeParse()`, `is()` or `safeParseAsync()`.

  Also exports a new `PresetName` type.

## 1.3.1

### Patch Changes

- 33cf0f5: Fix rule documentation links, which pointed to a non-existent GitHub account and returned 404 in editors and ESLint output.

  Recognize Valibot imported from JSR (`@valibot/valibot`) and through Deno `npm:`/`jsr:` specifiers. Previously every rule ignored these files.

  Catch up with Valibot 1.2 to 1.5 APIs:

  - `require-issue-messages` now covers `ksuid()`, `codePoints()`, `minCodePoints()`, `maxCodePoints()` and `notCodePoints()`, and reports `required(schema, [keys])` calls without a message instead of mistaking the keys array for one.
  - `no-async-action-in-sync-pipe` now reports `partialCheckAsync()`.
  - Schema-aware rules such as `no-recreated-schemas` now recognize `cache()`, `config()` and `keyof()`.
  - All rules treat the reserved-word aliases `null_()`, `undefined_()`, `void_()`, `enum_()` and `function_()` like their canonical names.

## 1.3.0

### Minor Changes

- 51127a3: Add `no-async-action-in-sync-pipe`, enabled by default in `recommended` and `strict`.

  Flags async Valibot actions (`checkAsync`, `checkItemsAsync`, `rawCheckAsync`, `rawTransformAsync`, `transformAsync`, `argsAsync`, `returnsAsync`, `awaitAsync`) used inside a synchronous `pipe()` call. Valibot's sync `pipe()` does not await these, so the async validation silently never runs — `parse()`/`safeParse()` read the unresolved `Promise` as if it were the result. TypeScript already blocks this via `pipe()`'s overloads, but plain JavaScript projects previously had no warning.

## 1.2.0

### Minor Changes

- 08f246d: Add recommended-preset rules for union correctness, pipe structure, and pipe conflicts:
  - `no-empty-union` — disallow `union([])`
  - `no-single-member-union` — disallow redundant single-member unions
  - `prefer-flatten-pipe` — flatten nested `pipe()` calls
  - `no-conflicting-pipe-actions` — catch impossible `minLength`/`maxLength` pairs
  - extend `no-redundant-transformation` to remove identity `transform()` actions in pipes and promote the rule to `error` in recommended/strict presets

  Also stop suggesting the nonexistent Valibot `toWellFormed()` action and make new autofixes preserve comments and expression precedence.

## 1.1.0

### Minor Changes

- d758957: feat: adds the `no-redundant-transformation` rule to flag manual transform() wrappers

## 1.0.0

### Major Changes

- 240176b: Initial stable release of eslint-plugin-valibot.

  This release introduces a first complete set of ESLint rules for safer, clearer, and more consistent Valibot usage, along with ready-to-use `recommended`, `strict`, and `stylistic` presets.

  Highlights:
  - add correctness and safety rules for common Valibot mistakes
  - add stylistic rules for consistent imports and schema naming
  - support both flat config and legacy config usage
  - ship generated docs, examples, and integration coverage for the published package
