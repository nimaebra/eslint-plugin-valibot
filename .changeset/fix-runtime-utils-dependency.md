---
'eslint-plugin-valibot': patch
---

Declare `@typescript-eslint/utils` as a runtime dependency so JavaScript consumers can load both plugin entry points without installing `typescript-eslint`. Exercise a minimal packaged consumer before adding TypeScript tooling.
