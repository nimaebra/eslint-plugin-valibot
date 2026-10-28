# Dependency security patches

## deepmerge 4.3.1

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
describes prototype poisoning in `deepmerge`. As of October 28, 2026, neither
`deepmerge` nor its parent dependency, `eslint-doc-generator`, has a release
that resolves it.

`deepmerge@4.3.1.patch` rejects `__proto__`, `constructor`, and `prototype`
keys in both the target-copy and source-merge paths, including recursive merges.
It patches the source and both published JavaScript bundles.
pnpm applies this patch during installation and records its hash in the lockfile.
The package is used by the development-only documentation CLI to merge its
configuration and command-line options. It is not included in the published
plugin's runtime dependencies.

The exception in `pnpm-workspace.yaml` applies only to this advisory because the
registry audit checks package versions and cannot recognize the patched code.
`pnpm security:audit` still checks all dependency groups at the `low` severity
threshold. Do not remove the patch while retaining this exception.

`tests/utils/deepmerge-security.test.ts` resolves the actual dependency used by
the docs CLI. It reproduces the exploit with null-prototype objects, null and
primitive placeholders, nested objects, and malicious target keys. It also
checks that ordinary config merges preserve arrays and callbacks. These tests
fail against the original dependency.

When an upstream fix becomes available, update the dependency, remove this patch
and the advisory exception, regenerate the lockfile, then run the security tests,
`pnpm security:audit`, `pnpm docs:build`, and `pnpm check`.
