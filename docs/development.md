# Development

## Local Workflow

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm smoke:pack -- --valibot-version latest
```

## Current Structure

- `src/rules`: rule implementations and exports
- `src/configs`: flat and legacy config builders
- `src/utils`: shared helpers used by rules
- `tests/rules`: rule-level tests

## Adding a Rule

1. Add the rule implementation under `src/rules/`.
2. Export it from `src/rules/index.ts`.
3. Wire it into the appropriate flat and legacy configs.
4. Add docs under `docs/rules/`.
5. Add tests under `tests/rules/`.

## Focused Checks

- Run one rule test file with `pnpm exec vitest run tests/rules/my-rule.test.ts --reporter=verbose`.
- Rebuild generated docs with `pnpm docs:build`.
- Validate the packaged install path with `pnpm smoke:pack -- --valibot-version latest`.
