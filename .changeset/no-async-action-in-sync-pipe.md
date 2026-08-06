---
'eslint-plugin-valibot': minor
---

Add `no-async-action-in-sync-pipe`, enabled by default in `recommended` and `strict`.

Flags async Valibot actions (`checkAsync`, `checkItemsAsync`, `rawCheckAsync`, `rawTransformAsync`, `transformAsync`, `argsAsync`, `returnsAsync`, `awaitAsync`) used inside a synchronous `pipe()` call. Valibot's sync `pipe()` does not await these, so the async validation silently never runs — `parse()`/`safeParse()` read the unresolved `Promise` as if it were the result. TypeScript already blocks this via `pipe()`'s overloads, but plain JavaScript projects previously had no warning.
