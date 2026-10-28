<!-- Use a Conventional Commit title: <type>[optional scope][!]: <description>.
Branch: <type>/<kebab-case-description>. See CONTRIBUTING.md#git-conventions. -->

## Summary

<!-- What does this change do, and why? -->

## Type of change

- [ ] Bug fix
- [ ] New rule
- [ ] Rule change (behavior, options, or preset membership)
- [ ] Documentation
- [ ] Chore / internal (build, deps, CI, tests)

## Checklist

- [ ] Branch, commit subjects, and PR title follow `CONTRIBUTING.md` (`pnpm conventions:check`)
- [ ] Tests added or updated for behavior changes (`tests/rules`, `tests/configs`, or `tests/integration`)
- [ ] Rule docs added or updated (`docs/rules/<rule>.md`) for rule changes
- [ ] `pnpm docs:build` run if metadata, docs, or preset membership changed
- [ ] Example fixtures updated (`examples/*`) if preset behavior changed
- [ ] Added a changeset (`pnpm changeset`) for any user-facing change
- [ ] `pnpm check` passes locally

## Related issues

<!-- Closes #123 -->
