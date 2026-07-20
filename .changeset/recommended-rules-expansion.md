---
'eslint-plugin-valibot': minor
---

Add recommended-preset rules for union correctness, pipe structure, and pipe conflicts:

- `no-empty-union` — disallow `union([])`
- `no-single-member-union` — disallow redundant single-member unions
- `prefer-flatten-pipe` — flatten nested `pipe()` calls
- `no-conflicting-pipe-actions` — catch impossible `minLength`/`maxLength` pairs
- extend `no-redundant-transformation` to remove identity `transform()` actions in pipes and promote the rule to `error` in recommended/strict presets

Also stop suggesting the nonexistent Valibot `toWellFormed()` action and make new autofixes preserve comments and expression precedence.
