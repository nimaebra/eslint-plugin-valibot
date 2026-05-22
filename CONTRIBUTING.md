# Contributing

This document covers local setup, contributor checks, and the workflow for adding or changing rules in `eslint-plugin-valibot`.

## Quick Start

This package targets the Node versions declared in [package.json](package.json) and uses `pnpm` for development.

```sh
pnpm install
pnpm check
```

`pnpm check` runs the main verification pipeline for the package:

- linting
- type-checking
- dependency checks with Knip
- rule and config tests
- build
- integration tests against the packaged output
- docs and config validation

## Repository Structure

Important directories in this package:

- [src/rules](src/rules): rule implementations and the rule registry
- [src/configs](src/configs): flat and legacy preset builders
- [src/utils](src/utils): shared AST helpers and utilities
- [tests/rules](tests/rules): rule-level test coverage
- [tests/configs](tests/configs): config export consistency tests
- [tests/integration](tests/integration): end-to-end checks against the built package and example projects
- [docs/rules](docs/rules): per-rule documentation
- [examples](examples): public usage examples used by integration tests
- [scripts](scripts): docs, config, scaffolding, and packaging utilities

There is also a sibling playground app at `../valibot-vite-playground` that can be useful for manual experimentation, but it is not part of the package verification pipeline.

## Common Commands

Run these from the package root.

| Command                                       | Purpose                                                     |
| :-------------------------------------------- | :---------------------------------------------------------- |
| `pnpm lint`                                   | Run ESLint across the package                               |
| `pnpm lint:fix`                               | Auto-fix lint issues where possible                         |
| `pnpm typecheck`                              | Run TypeScript without emitting output                      |
| `pnpm test`                                   | Run rule and config tests                                   |
| `pnpm test:watch`                             | Run Vitest in watch mode                                    |
| `pnpm build`                                  | Build ESM, CJS, and types into `dist/`                      |
| `pnpm test:integration`                       | Lint the example projects against the built package         |
| `pnpm docs:build`                             | Regenerate README rule metadata and config docs             |
| `pnpm docs:check`                             | Verify generated docs are up to date                        |
| `pnpm configs:check`                          | Verify documented config output stays in sync               |
| `pnpm knip`                                   | Check for unused files, exports, and dependencies           |
| `pnpm smoke:pack -- --valibot-version latest` | Validate the published package shape in a temporary install |

## Rule Workflow

When adding a new rule:

1. Scaffold the basic files if helpful:

   ```sh
   pnpm create:rule my-new-rule
   ```

2. Implement the rule in [src/rules](src/rules).
3. Export it from [src/rules/index.ts](src/rules/index.ts).
4. Register it in [src/rules/registry.ts](src/rules/registry.ts) and decide which presets should include it.
5. Add or update the rule documentation in [docs/rules](docs/rules).
6. Add rule tests in [tests/rules](tests/rules).

For a focused test run while iterating on one rule:

```sh
pnpm exec vitest run tests/rules/my-rule.test.ts --reporter=verbose
```

## Docs And Generated Content

Some docs are generated or partially generated:

- The implemented-rules section in [README.md](README.md) is maintained by `eslint-doc-generator`.
- [docs/configs.md](docs/configs.md) is generated from [src/rules/registry.ts](src/rules/registry.ts) by `pnpm docs:build`.
- Individual rule docs contain auto-generated header and options markers that should remain intact.

If you change rule metadata, preset membership, or rule docs, run:

```sh
pnpm docs:build
pnpm docs:check
```

## Examples And Integration Tests

The example projects under [examples](examples) act as user-facing references and as integration fixtures. If you change exported config behavior or add a rule that affects bundled presets, update the relevant example and run:

```sh
pnpm build
pnpm test:integration
```

## Pull Requests

Before opening a pull request:

1. Keep the change focused.
2. Add or update tests for behavior changes.
3. Update rule docs and generated docs when needed.
4. Run `pnpm check` from the package root.

If your change only touches one area, include the narrow command you used to validate it in the pull request description.

## Releases

Release-related scripts such as `changeset`, `version-packages`, and `release:publish` are primarily for maintainers.

Before merging a release PR or publishing manually:

1. Confirm npm publishing is configured for this repository. The GitHub workflow in [`.github/workflows/release.yml`](.github/workflows/release.yml) expects npm provenance-enabled publishing.
2. Run the full verification pipeline:

   ```sh
   pnpm check
   pnpm smoke:pack -- --valibot-version 1.0.0
   pnpm smoke:pack -- --valibot-version latest
   pnpm pack:dry-run
   ```

3. Add a changeset for any user-facing change:

   ```sh
   pnpm changeset
   ```

4. Let the release workflow open or update the version PR on `main`.
5. After publish, verify the npm package metadata points users to the correct README, repository, and issue tracker.
