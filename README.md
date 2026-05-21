# eslint-plugin-valibot

ESLint rules for safer, more maintainable Valibot usage.

This repository is in active development. The current scaffold includes the publishable package structure, dual ESM and CommonJS builds, flat and legacy config surfaces, and the first implemented Valibot rules.

## Installation

```sh
pnpm add -D eslint eslint-plugin-valibot valibot
```

## Flat Config

```js
import js from '@eslint/js';
import valibot from 'eslint-plugin-valibot';

export default [js.configs.recommended, ...valibot.flatConfigs.strict];
```

## Legacy Config

```js
module.exports = {
  extends: ['plugin:valibot/strict'],
};
```

## Implemented Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
⚠️ Configurations set to warn in.\
✅ Set in the `recommended` configuration.\
🔒 Set in the `strict` configuration.\
🎨 Set in the `stylistic` configuration.\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).

| Name                                                                               | Description                                                                                        | 💼   | ⚠️   | 🔧 |
| :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :--- | :--- | :- |
| [no-any-schema](docs/rules/no-any-schema.md)                                       | Disallow Valibot any() schemas.                                                                    |      | 🔒   |    |
| [no-duplicate-pipe-actions](docs/rules/no-duplicate-pipe-actions.md)               | Disallow duplicate Valibot actions inside the same pipe() call.                                    |      | ✅ 🔒 | 🔧 |
| [no-recreated-schemas](docs/rules/no-recreated-schemas.md)                         | Disallow recreating static Valibot schemas inside function scope.                                  |      | 🔒   |    |
| [no-redundant-schema-wrappers](docs/rules/no-redundant-schema-wrappers.md)         | Disallow redundant nested Valibot schema wrappers.                                                 | ✅ 🔒 |      | 🔧 |
| [no-schema-as-type](docs/rules/no-schema-as-type.md)                               | Disallow using a Valibot schema value itself as a TypeScript type.                                 | 🔒   |      |    |
| [no-unguarded-parse](docs/rules/no-unguarded-parse.md)                             | Require Valibot parse() and assert() calls to be wrapped in try/catch.                             | ✅ 🔒 |      |    |
| [prefer-nullish](docs/rules/prefer-nullish.md)                                     | Prefer nullish() over nested optional() and nullable() wrappers.                                   |      | ✅ 🔒 | 🔧 |
| [require-default-in-optional-pipe](docs/rules/require-default-in-optional-pipe.md) | Require a default when optional() or nullish() starts a pipe inside an object schema entry.        |      | ✅ 🔒 |    |
| [require-safe-parse-success-check](docs/rules/require-safe-parse-success-check.md) | Require checking result.success before reading output or issues from a Valibot safeParse() result. | ✅ 🔒 |      |    |
| [schema-name-suffix](docs/rules/schema-name-suffix.md)                             | Require schema variables to use a consistent suffix such as Schema.                                |      | 🎨   |    |

<!-- end auto-generated rules list -->

## Development

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
pnpm docs:check
pnpm configs:check
```

Additional docs live in `docs/` and will expand as more rules land.

## Utility Scripts

```sh
pnpm docs:build
pnpm create:rule my-new-rule
pnpm smoke:pack -- --valibot-version latest
```
