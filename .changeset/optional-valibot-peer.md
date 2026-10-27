---
'eslint-plugin-valibot': patch
---

Make the Valibot peer dependency optional while retaining its supported version range, so shared ESLint config packages do not need to install Valibot. Verify both packaged entry points can lint source without Valibot available at runtime.
