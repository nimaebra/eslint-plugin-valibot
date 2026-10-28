---
'eslint-plugin-valibot': patch
---

Preserve backslashes and control characters in discriminator keys when autofixing `prefer-variant`, preventing changed keys and invalid JavaScript.

Avoid false positives in `no-transform-in-record-key` when a function parameter shadows an outer schema binding.
