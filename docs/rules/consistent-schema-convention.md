# valibot/consistent-schema-convention

📝 Enforce a consistent Valibot schema naming convention for exported schemas and inferred types.

⚠️ This rule _warns_ in the 🎨 `stylistic` config.

<!-- end auto-generated rule header -->

Enforce one of Valibot's recommended naming conventions for schemas and inferred types.

This rule follows the naming guidance from the Valibot naming convention guide. By default, it enforces the more explicit suffix-based convention on exported schemas and inferred type aliases.

## Why

Valibot recommends two naming styles when you export schemas together with inferred types:

- A shared-name convention such as `PublicUser` for both the schema and type.
- A suffix convention such as `ImageSchema`, `ImageInput`, and `ImageOutput`.

Mixing those conventions casually makes exported APIs harder to scan and makes it less obvious whether a symbol is a runtime schema or an inferred type.

## Options

```json
{
  "convention": "suffix",
  "scope": "exported",
  "schemaSuffix": "Schema",
  "inputSuffix": "Input",
  "outputSuffix": "Output",
  "dataSuffix": "Data",
  "allowDataSuffix": true
}
```

| Option            | Type                      | Default      | Description                                                                                                     |
| :---------------- | :------------------------ | :----------- | :-------------------------------------------------------------------------------------------------------------- |
| `convention`      | `'suffix' \| 'same-name'` | `'suffix'`   | Selects which Valibot naming convention to enforce.                                                             |
| `scope`           | `'exported' \| 'all'`     | `'exported'` | Controls whether the rule checks only exported schema and type names or all matching bindings.                  |
| `schemaSuffix`    | `string`                  | `'Schema'`   | Defines the schema suffix used when `convention` is `'suffix'`.                                                 |
| `inputSuffix`     | `string`                  | `'Input'`    | Defines the suffix required for `InferInput<typeof Schema>` aliases when `convention` is `'suffix'`.            |
| `outputSuffix`    | `string`                  | `'Output'`   | Defines the suffix required for `InferOutput<typeof Schema>` aliases when `convention` is `'suffix'`.           |
| `dataSuffix`      | `string`                  | `'Data'`     | Defines the optional shared suffix that can stand in for inferred type aliases under the `'suffix'` convention. |
| `allowDataSuffix` | `boolean`                 | `true`       | Allows `Data`-style aliases such as `UserData` as an alternative to `Input` or `Output`.                        |

### Example `same-name` configuration

```json
{
  "rules": {
    "valibot/consistent-schema-convention": [
      "warn",
      { "convention": "same-name" }
    ]
  }
}
```

### Example `scope: all` configuration

```json
{
  "rules": {
    "valibot/consistent-schema-convention": ["warn", { "scope": "all" }]
  }
}
```

## Incorrect

### Default `suffix` convention

```ts
import * as v from 'valibot';

export const PublicUser = v.object({
  name: v.string(),
});

export type PublicUser = v.InferOutput<typeof PublicUser>;
```

### `same-name` convention

```ts
import * as v from 'valibot';

export const PublicUserSchema = v.object({
  name: v.string(),
});

export type PublicUserOutput = v.InferOutput<typeof PublicUserSchema>;
```

## Correct

### Default `suffix` convention

```ts
import * as v from 'valibot';

export const PublicUserSchema = v.object({
  name: v.string(),
});

export type PublicUserOutput = v.InferOutput<typeof PublicUserSchema>;
```

### `same-name` convention

```ts
import * as v from 'valibot';

export const PublicUser = v.object({
  name: v.string(),
});

export type PublicUser = v.InferOutput<typeof PublicUser>;
```

<!-- end auto-generated rule options -->

## Autofix

No. This rule does not provide autofix because renaming schema and inferred type identifiers requires coordinated symbol renames across the project.

## Further Reading

- [Valibot Naming Convention Guide](https://valibot.dev/guides/naming-convention/)
