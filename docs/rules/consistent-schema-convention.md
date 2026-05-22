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

- `convention`: choose `'suffix'` or `'same-name'`. Default: `'suffix'`.
- `scope`: check only exported bindings or all bindings. Default: `'exported'`.
- `schemaSuffix`: schema suffix for the `suffix` convention. Default: `'Schema'`.
- `inputSuffix`: input type suffix for the `suffix` convention. Default: `'Input'`.
- `outputSuffix`: output type suffix for the `suffix` convention. Default: `'Output'`.
- `dataSuffix`: optional shared type suffix for the `suffix` convention. Default: `'Data'`.
- `allowDataSuffix`: allow `Data` as an alternative inferred type suffix. Default: `true`.

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

<!-- end auto-generated rule options -->

## Autofix

No.
