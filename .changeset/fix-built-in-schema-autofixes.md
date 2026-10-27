---
'eslint-plugin-valibot': patch
---

Replace `no-instanceof-builtins` autofixes with explicit editor suggestions where valid. Avoid unbound replacement imports and invalid collection schemas, and ignore locally defined constructors with built-in names.
