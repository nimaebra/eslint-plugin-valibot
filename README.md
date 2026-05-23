# eslint-plugin-valibot

ESLint rules for safer, more maintainable Valibot usage.

`eslint-plugin-valibot` helps catch common schema mistakes such as unguarded parsing, invalid `pipe()` usage, redundant wrappers, and other patterns that make Valibot code harder to maintain.

The plugin ships with both flat-config and legacy-config presets, plus individual rules that you can enable as needed.

## Installation

```sh
pnpm add -D eslint-plugin-valibot
```

It is designed for `eslint@^9 || ^10` and `valibot@^1`.

## Flat Config

```js
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import valibot from 'eslint-plugin-valibot';

export default defineConfig(
  js.configs.recommended,
  ...valibot.flatConfigs.recommended,
);
```

Use `valibot.flatConfigs.strict` for the stricter preset, or append `...valibot.flatConfigs.stylistic` if you also want the naming-style rule.

## Legacy Config

```js
module.exports = {
  extends: ['plugin:valibot/recommended'],
};
```

Available legacy presets are:

- `plugin:valibot/recommended`
- `plugin:valibot/strict`
- `plugin:valibot/stylistic`

## TypeScript Projects

If you lint TypeScript, compose this plugin with `typescript-eslint`. The `strict` preset includes `valibot/no-schema-as-type`, which only applies to TypeScript syntax.

```js
import tseslint from 'typescript-eslint';
import valibot from 'eslint-plugin-valibot';

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...valibot.flatConfigs.strict,
);
```

## Config Presets

| Preset        | Intended use                                           | Notes                                                                      |
| :------------ | :----------------------------------------------------- | :------------------------------------------------------------------------- |
| `recommended` | Good default for most codebases                        | Focuses on common correctness and safety issues.                           |
| `strict`      | Tighter policy for teams that want broader enforcement | Includes everything in `recommended` plus stricter schema usage checks.    |
| `stylistic`   | Naming consistency                                     | Adds naming-convention rules without changing the problem-focused presets. |

See [docs/configs.md](docs/configs.md) for the exact rule list in each preset.

## Individual Rules

If you prefer to enable rules one by one, register the plugin and configure only the rules you want:

```js
import { defineConfig } from 'eslint/config';
import valibot from 'eslint-plugin-valibot';

export default defineConfig({
  plugins: {
    valibot,
  },
  rules: {
    'valibot/no-unguarded-parse': 'error',
    'valibot/prefer-nullish': 'warn',
  },
});
```

## Examples

Working example setups live in this repository:

- [examples/flat](examples/flat)
- [examples/legacy](examples/legacy)
- [examples/typescript](examples/typescript)

The default flat and legacy examples use the `recommended` preset. The flat example directory also includes dedicated `strict` and `stylistic` config files for stricter or naming-focused setups.

## Implemented Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
⚠️ Configurations set to warn in.\
✅ Set in the `recommended` configuration.\
🔒 Set in the `strict` configuration.\
🎨 Set in the `stylistic` configuration.\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).

| Name                                                                                       | Description                                                                                       | 💼   | ⚠️   | 🔧 |
| :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :--- | :--- | :- |
| [consistent-import](docs/rules/consistent-import.md)                                       | Enforce a consistent Valibot import style using either namespace or named imports.                |      | 🎨   |    |
| [consistent-schema-convention](docs/rules/consistent-schema-convention.md)                 | Enforce a consistent Valibot schema naming convention for exported schemas and inferred types.    |      | 🎨   |    |
| [no-any-schema](docs/rules/no-any-schema.md)                                               | Disallow Valibot any() schemas.                                                                   |      | 🔒   |    |
| [no-duplicate-pipe-actions](docs/rules/no-duplicate-pipe-actions.md)                       | Disallow duplicate Valibot actions inside the same pipe() call.                                   |      | ✅ 🔒 | 🔧 |
| [no-empty-pipe](docs/rules/no-empty-pipe.md)                                               | Disallow empty pipe() calls or pipe() calls with a single argument.                               | ✅ 🔒 |      | 🔧 |
| [no-instanceof-builtins](docs/rules/no-instanceof-builtins.md)                             | Prefer primitive schema functions over instance(Constructor) for built-in types.                  | ✅ 🔒 |      | 🔧 |
| [no-loose-object](docs/rules/no-loose-object.md)                                           | Disallow disallowed Valibot object schema constructors such as looseObject().                     |      | 🔒   |    |
| [no-recreated-schemas](docs/rules/no-recreated-schemas.md)                                 | Disallow recreating static Valibot schemas inside function scope.                                 |      | 🔒   |    |
| [no-redundant-schema-wrappers](docs/rules/no-redundant-schema-wrappers.md)                 | Disallow redundant nested Valibot schema wrappers.                                                | ✅ 🔒 |      | 🔧 |
| [no-schema-as-type](docs/rules/no-schema-as-type.md)                                       | Disallow using a Valibot schema value itself as a TypeScript type.                                | 🔒   |      |    |
| [no-transform-in-record-key](docs/rules/no-transform-in-record-key.md)                     | Disallow transforms in record() key schemas, which can silently mutate keys and cause collisions. | ✅ 🔒 |      |    |
| [no-unguarded-parse](docs/rules/no-unguarded-parse.md)                                     | Require Valibot parse() and assert() calls to be wrapped in try/catch.                            | ✅ 🔒 |      |    |
| [no-unknown-schema](docs/rules/no-unknown-schema.md)                                       | Disallow Valibot unknown() schemas.                                                               |      | 🔒   |    |
| [prefer-nullable-over-union-null](docs/rules/prefer-nullable-over-union-null.md)           | Prefer nullable() over union([schema, null()]) when they are equivalent.                          |      | ✅ 🔒 | 🔧 |
| [prefer-nullish](docs/rules/prefer-nullish.md)                                             | Prefer nullish() over nested optional() and nullable() wrappers.                                  |      | ✅ 🔒 | 🔧 |
| [prefer-optional-over-union-undefined](docs/rules/prefer-optional-over-union-undefined.md) | Prefer optional() over union([schema, undefined()]) when they are equivalent.                     |      | ✅ 🔒 | 🔧 |
| [prefer-picklist](docs/rules/prefer-picklist.md)                                           | Prefer picklist() over union() when the union only contains literal string schemas.               |      | 🎨   | 🔧 |
| [prefer-variant](docs/rules/prefer-variant.md)                                             | Prefer variant() over union() when object schemas share an obvious discriminant key.              |      | 🎨   | 🔧 |
| [require-issue-messages](docs/rules/require-issue-messages.md)                             | Require explicit custom issue messages on Valibot schemas and issue-producing actions.            |      | 🔒   |    |

<!-- end auto-generated rules list -->

Every rule has its own documentation page under [docs/rules](docs/rules).

## Contributing

Contributor setup, checks, and rule authoring workflow live in [CONTRIBUTING.md](CONTRIBUTING.md).
