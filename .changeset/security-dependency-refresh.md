---
'eslint-plugin-valibot': patch
---

Refresh build, test, and release dependencies to resolve development dependency vulnerabilities, and upgrade the build tool to tsup 9 while preserving the package's ESM, CommonJS, and type declaration exports.

Use patched Node.js 24.22.1 for development and publishing, and audit all dependencies in CI and before publishing. The package's supported Node.js range is unchanged; consumers must update their own Node.js installation to receive runtime security fixes.
