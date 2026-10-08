---
'eslint-plugin-valibot': minor
---

Add five correctness rules, enabled as errors in `recommended` and `strict`:

- `no-throw-in-check`: disallows `throw` inside `check()`, `transform()`, `rawCheck()` and similar callbacks, because Valibot does not catch it and it escapes `safeParse()`.
- `no-length-check-before-trim`: disallows `nonEmpty()`, `minLength()` and similar lower-bound checks before `trim()` in the same pipe, where whitespace-only input can pass them. Offers a suggestion to move the trim.
- `no-unchecked-safe-parse`: requires checking `success` before reading `output` from `safeParse()`, since `output` holds the unvalidated input on failure.
- `no-async-schema-in-sync-parent`: disallows async schemas inside sync schemas or sync parse calls. In that case Valibot skips the async child's validation and reports success.
- `no-unawaited-parse-async`: disallows reading `.success`, `.output` or other result properties from an un-awaited `parseAsync()` or `safeParseAsync()` promise, and disallows discarding the promise. Offers an `await` suggestion.
