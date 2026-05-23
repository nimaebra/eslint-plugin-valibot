# valibot/require-issue-messages

📝 Require explicit custom issue messages on Valibot schemas and issue-producing actions.

⚠️ This rule _warns_ in the 🔒 `strict` config.

<!-- end auto-generated rule header -->

Require explicit custom issue messages on Valibot schemas and issue-producing actions.

## Why

Generic fallback messages such as `Invalid type` or `Invalid length` are usually not good enough in production applications. Requiring explicit issue messages helps teams keep validation output clearer, more consistent, and easier to localize.

## Incorrect

```ts
import * as v from 'valibot';

const PasswordSchema = v.pipe(v.string(), v.minLength(8));
```

## Correct

```ts
import * as v from 'valibot';

const PasswordSchema = v.pipe(
  v.string('Must be text'),
  v.minLength(8, 'Password too short'),
);
```

Wrapping an individual schema or action with `message()` also satisfies the rule.

```ts
import * as v from 'valibot';

const PasswordSchema = v.pipe(
  v.string('Must be text'),
  v.message(v.minLength(8), 'Password too short'),
);
```

<!-- end auto-generated rule options -->

## Autofix

No. This rule does not provide autofix because creating meaningful, localized validation messages requires domain-specific wording.

## Further Reading

- [Valibot message() API](https://valibot.dev/api/message/)
- [Valibot pipe() API](https://valibot.dev/api/pipe/)
