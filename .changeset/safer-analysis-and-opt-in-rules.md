---
'eslint-plugin-valibot': minor
---

Add opt-in `no-discarded-safe-parse` and `no-shared-mutable-default` rules. Discarded optional calls are reported, and factory suggestions account for `await` and `yield`. Both rules are included in `all`.

Resolve Valibot calls through parser references, including in TypeScript type-only shadowing and default parameter scopes. Resolve replacement imports and schema type queries by binding identity. Runtime analysis uses value imports and stable CommonJS bindings from the global `require`.

Extend `no-unchecked-safe-parse` to computed properties, stable aliases and mutable bindings, and guarded destructured output. Reads of destructured output require a check of the corresponding `success` binding. Guards use binding identity, including captured stable results. Direct mutations invalidate the affected property only where they can reach a check or read.

Detect conflicting length bounds across known value-preserving validations. Stop constraint and trim-order analysis at transformations, unknown actions, and spreads. Complete root named rule exports with `noEmptyPipe`, `noInstanceofBuiltins`, and `requireIssueMessages`.

Preserve comments in wrapper and nullish/nullable/optional simplification fixes. Pair each trim-order diagnostic with the following trim when a pipe contains multiple trim actions.
