# Contributing

This document covers local setup, contributor checks, and the workflow for adding or changing rules in `eslint-plugin-valibot`.

## Quick Start

This package targets the Node versions declared in [package.json](package.json) and uses `pnpm` for development. Contributors and the release workflow use the patched Node.js version in [`.nvmrc`](.nvmrc). With nvm installed:

```sh
nvm install
nvm use
corepack enable
pnpm install
pnpm security:audit
pnpm check
```

Use the pnpm version pinned in `package.json`. Updating this repository does not update consumers' Node.js installations; consumers should install current security patches for their Node.js release line.

To validate branches and commit messages locally, enable Husky after installing dependencies:

```sh
pnpm hooks:install
```

This sets this clone's `core.hooksPath` to Husky's `.husky/_` directory. If you already use a custom hook directory, integrate the commands in [`.husky/pre-commit`](.husky/pre-commit) and [`.husky/commit-msg`](.husky/commit-msg) there instead. CI checks conventions even when local hooks are not installed. Hooks are opt-in for each clone and are not installed as a package lifecycle side effect.

`pnpm check` runs the main verification pipeline for the package:

- linting
- type-checking
- dependency checks with Knip
- rule and config tests
- build
- integration tests against the packaged output
- docs and config validation

## Git Conventions

Use the same change types for branches, commits, and pull request titles. [Commitlint](https://commitlint.js.org/) enforces [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) through `@commitlint/config-conventional`. [validate-branch-name](https://github.com/JsonMa/validate-branch-name) checks branch names, and [Husky](https://typicode.github.io/husky/) runs the local hooks. Configuration lives in [commitlint.config.mjs](commitlint.config.mjs) and [.validate-branch-namerc.json](.validate-branch-namerc.json); [commitlint.pr.config.mjs](commitlint.pr.config.mjs) reuses the commit rules with ignores disabled for PR titles.

| Type       | Use for                                                  | Branch example                  |
| :--------- | :------------------------------------------------------- | :------------------------------ |
| `feat`     | New rules, options, or other public features             | `feat/no-empty-pipe`            |
| `fix`      | Bug fixes                                                | `fix/aliased-imports`           |
| `docs`     | Documentation changes                                    | `docs/config-examples`          |
| `style`    | Formatting changes without behavior changes              | `style/format-rule-tests`       |
| `refactor` | Code restructuring without public behavior changes       | `refactor/pipe-analysis`        |
| `perf`     | Performance improvements                                 | `perf/import-resolution`        |
| `test`     | Test additions or corrections                            | `test/async-schema-regressions` |
| `build`    | Build tooling or package output                          | `build/declaration-output`      |
| `ci`       | GitHub Actions and CI configuration                      | `ci/node-matrix`                |
| `chore`    | Maintenance, dependency updates, and release preparation | `chore/repository-conventions`  |
| `revert`   | Reverting an earlier change                              | `revert/preset-defaults`        |

### Branches

Create focused branches from the latest `main`, using `<type>/<description>`. The description contains lowercase letters, numbers, and single hyphens between words. Use the purpose of the change as the prefix, including for agent-created branches; for example, use `fix/aliased-imports` instead of `codex/aliased-imports`.

```sh
git fetch origin
git switch -c feat/no-empty-pipe origin/main
```

Reserved names are `main`, Changesets' `changeset-release/main`, and Dependabot's `dependabot/**` branches. Their commits and PR titles still follow the commit convention. Existing merged branches and historical commits do not need renaming or rewriting. For an unmerged branch using an old prefix, rename it with `git branch -m <type>/<description>` before opening its PR.

### Commits And Pull Request Titles

Use `<type>[optional scope][!]: <description>`; the brackets indicate optional parts and are not literal characters. Scopes identify an area such as a rule name, `configs`, `deps`, or `release`. Use lowercase types and scopes. Write a concise imperative description with one space after the colon, no surrounding whitespace, and no final period. Commitlint's conventional preset limits the full subject to 100 characters.

```text
feat(no-empty-pipe): detect pipes without actions
fix(imports): resolve aliased Valibot calls
test: cover async schema regressions
docs: explain strict preset setup
chore(deps): update development dependencies
ci: verify Node compatibility
chore(release): release packages
```

Put optional commit bodies and footers after a blank line. Mark breaking changes with `!` before the colon or a `BREAKING CHANGE:` footer, and explain the migration. Keep that information in the final squash commit and add a major changeset for a breaking public change.

```text
feat(configs)!: enable the new correctness rule

BREAKING CHANGE: the recommended preset now reports this pattern as an error.
```

Each commit should describe its own change; its type does not have to match the branch type. PR titles describe the overall change. Prefer squash merging and use the validated PR title as the squash commit subject. If using another merge method, preserve the conventional subjects. Commitlint's standard ignores apply to Git-generated merge, revert, version, and autosquash messages; PR titles are checked with those ignores disabled. Squash temporary `fixup!` and `squash!` commits before requesting review. For a conventional revert, use `git revert --no-commit <sha>` followed by `git commit -m "revert: describe the reverted change"`.

### Checking Conventions

Before pushing, fetch the base branch and check your branch and all new non-merge commits:

```sh
git fetch origin main
pnpm conventions:check
```

For a different PR base, run `pnpm branch:check` and `pnpm commitlint --from <ref> --to HEAD --verbose`. To check a proposed message, pipe it to Commitlint:

```sh
printf '%s\n' 'fix(imports): resolve aliased Valibot calls' | pnpm commitlint
```

Husky checks the branch before committing and runs Commitlint on the commit message. The **Git conventions** workflow checks the source branch, PR title, and commit range introduced by the PR using the same installed packages. It runs again when the PR title is edited or new commits are pushed. It uses PR metadata, including for fork contributions, and does not recheck historical commits already in the target branch.

To enforce this before merging, maintainers can require the **conventions** status check in the `main` branch ruleset. Workflow files alone do not configure repository branch protection.

## Repository Structure

Important directories in this package:

- [src/rules](src/rules): rule implementations and the rule registry
- [src/configs](src/configs): flat and legacy preset builders
- [src/utils](src/utils): shared AST helpers and utilities
- [tests/rules](tests/rules): rule-level test coverage
- [tests/configs](tests/configs): config export consistency tests
- [tests/utils](tests/utils): helper tests and Valibot API drift checks
- [tests/integration](tests/integration): end-to-end checks against the built package and example projects
- [docs/rules](docs/rules): per-rule documentation
- [examples](examples): public usage examples used by integration tests
- [scripts](scripts): docs, config, scaffolding, and packaging utilities

There is also a sibling playground app at `../valibot-vite-playground` that can be useful for manual experimentation, but it is not part of the package verification pipeline.

## Common Commands

Run these from the package root.

| Command                                       | Purpose                                                       |
| :-------------------------------------------- | :------------------------------------------------------------ |
| `pnpm lint`                                   | Run ESLint across the package                                 |
| `pnpm lint:fix`                               | Auto-fix lint issues where possible                           |
| `pnpm typecheck`                              | Run TypeScript without emitting output                        |
| `pnpm test`                                   | Run rule and config tests                                     |
| `pnpm test:watch`                             | Run Vitest in watch mode                                      |
| `pnpm build`                                  | Build ESM, CJS, and types into `dist/`                        |
| `pnpm test:integration`                       | Lint the example projects against the built package           |
| `pnpm docs:build`                             | Regenerate README rule metadata and config docs               |
| `pnpm docs:check`                             | Verify generated docs are up to date                          |
| `pnpm configs:check`                          | Verify documented config output stays in sync                 |
| `pnpm conventions:check`                      | Check branch names and commits introduced since `origin/main` |
| `pnpm branch:check`                           | Validate the current branch with validate-branch-name         |
| `pnpm commitlint`                             | Validate a commit message from standard input                 |
| `pnpm hooks:install`                          | Enable Husky branch and commit validation in this clone       |
| `pnpm knip`                                   | Check for unused files, exports, and dependencies             |
| `pnpm security:audit`                         | Audit all dependencies, including development tools           |
| `pnpm smoke:pack -- --valibot-version latest` | Validate the published package shape in a temporary install   |

The package smoke test checks ESM imports, CommonJS loading, type declarations, and lint behavior. Pass `--eslint-version 9` or `--eslint-version 10` (the default) to test either supported ESLint major; `--valibot-version` defaults to `latest`. CI tests both ESLint majors against Valibot `1.0.0` and `latest`.

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

1. Keep the change focused and use the branch, commit, and PR title conventions above.
2. Add or update tests for behavior changes.
3. Update rule docs and generated docs when needed.
4. Run `pnpm check` from the package root.

If your change only touches one area, include the narrow command you used to validate it in the pull request description.

## Releases

Release-related scripts such as `changeset`, `version-packages`, and `release:publish` are primarily for maintainers.

Use `chore/<description>` for manual release preparation. Dependabot creates `chore(deps):` / `chore(deps-dev):` commits for package updates and `ci(deps):` commits for Actions updates. Changesets uses `chore(release): release packages` for its version commit and PR title. Published package tags use `v<version>` (for example, `v1.4.2`).

Changesets files determine version bumps and changelog entries; commit types do not publish packages or choose a version automatically. Add a changeset for a public feature, fix, or breaking change. Purely internal CI, test, documentation, and repository maintenance changes do not need one unless they affect the published package. Merge convention changes before preparing the next release; the conventions setup itself does not require a package version bump.

Before merging a release PR or publishing manually:

1. Confirm npm publishing is configured for this repository. The GitHub workflow in [`.github/workflows/release.yml`](.github/workflows/release.yml) expects npm provenance-enabled publishing.
2. Run the full verification pipeline:

   ```sh
   pnpm security:audit
   pnpm check
   pnpm smoke:pack -- --eslint-version 9 --valibot-version 1.0.0
   pnpm smoke:pack -- --eslint-version 9 --valibot-version latest
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
