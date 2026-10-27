---
'eslint-plugin-valibot': patch
---

Restrict `no-duplicate-pipe-actions` to consecutive known idempotent actions with literal arguments. Preserve repeated transforms, stateful callbacks, and validations separated by transformations, and retain comments during fixes.
