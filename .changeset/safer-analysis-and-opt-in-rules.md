---
'eslint-plugin-valibot': minor
---

Add opt-in `no-discarded-safe-parse` and `no-shared-mutable-default` rules. Both are included in `all`; existing recommended, strict, and stylistic preset membership is unchanged.

Resolve Valibot calls and replacement imports by binding identity, ignoring shadowed names, type-only runtime imports, locally defined `require`, and reassigned CommonJS imports. Track schema type queries by binding as well.

Extend `no-unchecked-safe-parse` to computed properties, stable aliases and mutable bindings, and guarded destructured output. Merely destructuring `success` no longer permits unchecked output reads. Guards use binding identity, including captured stable results, and mutations invalidate guard assumptions.

Detect conflicting length bounds across known value-preserving validations. Stop constraint and trim-order analysis at transformations, unknown actions, and spreads. Complete root named rule exports with `noEmptyPipe`, `noInstanceofBuiltins`, and `requireIssueMessages`.

Preserve comments in wrapper and nullish/nullable/optional simplification fixes. Pair each trim-order diagnostic with the following trim when a pipe contains multiple trim actions.
