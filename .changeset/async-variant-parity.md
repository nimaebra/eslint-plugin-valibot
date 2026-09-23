---
'eslint-plugin-valibot': minor
---

Apply rules to Valibot's async APIs. Previously most rules only matched the sync names, so async schemas were silently skipped.

- `no-empty-pipe`, `no-duplicate-pipe-actions`, `no-conflicting-pipe-actions`, `prefer-flatten-pipe` and `no-redundant-transformation` now check `pipeAsync()`. `prefer-flatten-pipe` flattens sync and async inner pipes into an outer `pipeAsync()`.
- `no-empty-union`, `no-single-member-union`, `prefer-picklist`, `prefer-variant`, `prefer-nullable-over-union-null` and `prefer-optional-over-union-undefined` now check `unionAsync()`. Autofixes keep the async API, e.g. `unionAsync([schema, null()])` becomes `nullableAsync(schema)`.
- `no-redundant-schema-wrappers` and `prefer-nullish` now check `optionalAsync()`, `nullableAsync()` and the other async wrappers.
- `no-loose-object` now checks `looseObjectAsync()`.
- `no-transform-in-record-key` now checks `recordAsync()`, `pipeAsync()`, `transformAsync()` and `rawTransformAsync()`.
- `no-recreated-schemas` and the schema-aware naming rules now recognize async schema constructors such as `objectAsync()`.
