# valibot/consistent-import

📝 Enforce a consistent Valibot import style using either namespace or named imports.

⚠️ This rule _warns_ in the 🎨 `stylistic` config.

<!-- end auto-generated rule header -->

Enforce a consistent Valibot import style across your codebase.

Modern bundlers like Vite and Rollup, Webpack 5+, esbuild, and Next.js Turbopack tree-shake both namespace and named imports effectively. As Valibot documents, tree shaking and code splitting should work with either import style.

That means this choice is mostly about developer experience and architecture:

- Namespace import style avoids naming collisions with common names like string and object.
- Named import style keeps schema bodies shorter and makes local dependencies explicit.

## Why

Mixed import styles create churn and make modules less predictable. A single, explicit convention improves readability and makes migration and code review easier.

## Options

```json
{
  "style": "namespace",
  "namespaceAlias": "v"
}
```

| Option           | Type                     | Default       | Description                                   |
| :--------------- | :----------------------- | :------------ | :-------------------------------------------- |
| `style`          | `'namespace' \| 'named'` | `'namespace'` | Selects the required Valibot import style.    |
| `namespaceAlias` | `string`                 | `'v'`         | Required alias when `style` is `'namespace'`. |

### Example named-import configuration

```json
{
  "rules": {
    "valibot/consistent-import": ["warn", { "style": "named" }]
  }
}
```

## Incorrect

### Default namespace mode

```ts
import { object, string } from 'valibot';

const UserSchema = object({
  id: string(),
});
```

### Named mode

```ts
import * as v from 'valibot';

const UserSchema = v.object({
  id: v.string(),
});
```

## Correct

### Default namespace mode

```ts
import * as v from 'valibot';

const UserSchema = v.object({
  id: v.string(),
});
```

### Named mode

```ts
import { object, string } from 'valibot';

const UserSchema = object({
  id: string(),
});
```

<!-- end auto-generated rule options -->

## Autofix

No.
