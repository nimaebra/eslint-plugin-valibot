# eslint-plugin-valibot

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
