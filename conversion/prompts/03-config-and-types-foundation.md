# Step 03 — Config & Shared Types Foundation

> **Prerequisite:** [`02-tooling-lint-format-test.md`](./02-tooling-lint-format-test.md) complete
> (lint/format/test/typecheck all understand `.ts`).

## Goal

Convert the configuration layer and establish the typed foundation the rest of the app imports:
`config.ts`, the convict helper it depends on, a place for shared types, and the **first Zod
schema** to set the domain-modelling pattern. This is the first application code converted, and
it's a "leaf" everything else depends on — so it must end fully green.

## Prerequisites / starting state

- `src/config.js` — a convict config object with `serviceVersion`, `host`, `port`, `mongo.*`,
  logging, tracing, etc. Exposes `config.get(...)`.
- `src/common/helpers/convict/validate-mongo-uri.js` (+ its `.test.js`) — a custom convict format.
- Imports use the `#/` alias and `.js` specifiers.

## Context — files you will touch

- `src/common/helpers/convict/validate-mongo-uri.js` → `.ts`
- `src/config.js` → `config.ts`
- **New:** `src/common/types/` — a home for shared `type` aliases/interfaces.
- **New (pattern seed):** a Zod schema demonstrating the domain-model approach (kept minimal here;
  the real domain schema lands in step 06).

## Instructions

### 1. Convert the convict format helper

Rename `validate-mongo-uri.js` → `validate-mongo-uri.ts`. Add parameter/return types and JSDoc.
Keep the runtime behaviour identical. Update its imports to `.js` specifiers as needed.

```ts
/**
 * Convict format that validates a value is a well-formed MongoDB connection URI.
 *
 * @throws {Error} If the provided value is not a valid Mongo URI.
 */
export const convictValidateMongoUri = {
  name: 'mongo-uri',
  validate(value: string): void {
    // ...existing validation logic, now typed...
  },
  coerce(value: string): string {
    return value
  }
}
```

> Match the exact shape convict expects. If convict's types are available, annotate against them;
> otherwise type the `validate`/`coerce` signatures explicitly. Do not use `any`.

### 2. Convert `config.js` → `config.ts`

Rename and type it. `convict` is generically typed, so `config.get('port')` infers `number`,
`config.get('mongo')` infers the mongo sub-object, etc. Keep the schema **unchanged**.

```ts
import convict from 'convict'
import convictFormatWithValidator from 'convict-format-with-validator'
import { convictValidateMongoUri } from '#/common/helpers/convict/validate-mongo-uri.js'

convict.addFormat(convictValidateMongoUri)
convict.addFormats(convictFormatWithValidator)

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

export const config = convict({
  // ...unchanged schema...
})

config.validate({ allowed: 'strict' })
```

- If `config.validate(...)` is called at module load today, preserve that.
- Do **not** widen anything to `any`. If a convict field's inferred type is awkward, introduce a
  small `type` in `src/common/types/` rather than casting.

### 3. Create the shared types home

Add `src/common/types/index.ts` (or focused files) for cross-cutting `type` aliases used by
multiple layers, e.g. a `MongoConfig` derived from the config shape, or reusable primitives.
Keep it small — only add types that are actually shared. Export with JSDoc.

```ts
/** Runtime configuration for the MongoDB connection, as read from convict. */
export type MongoConfig = {
  mongoUrl: string
  databaseName: string
  mongoOptions?: Record<string, unknown>
}
```

### 4. Seed the Zod domain-model pattern

Add a tiny Zod example to establish the convention the services step will follow (the real
`example-data` schema is created in step 06). Place it where it will live long-term, e.g.
`src/services/example-data.ts`, or defer entirely to step 06 — but if you add it now, follow the
`z.infer` pattern:

```ts
import { z } from 'zod'

/** Runtime schema for an example record stored in the `example-data` collection. */
export const exampleDataSchema = z.object({
  exampleId: z.string(),
  name: z.string()
})

/** Static type derived from {@link exampleDataSchema}. */
export type ExampleData = z.infer<typeof exampleDataSchema>
```

> Keep Joi out of this step — Zod is for domain types; Joi stays at the HTTP route boundary (step 05).

### 5. Convert the helper's test (optional now, mandatory by step 07)

You may convert `validate-mongo-uri.test.js` → `.ts` now to keep it colocated and passing, or
leave test migration entirely to step 07. If you convert it now, ensure it runs green.

## Acceptance criteria

- [ ] `src/config.ts` and `src/common/helpers/convict/validate-mongo-uri.ts` exist; the `.js`
      originals are removed.
- [ ] `npm run typecheck` passes with **0 errors**.
- [ ] `npm run lint` and `npm run format:check` pass.
- [ ] `npm run test` passes (config-dependent tests still green).
- [ ] `config.get('port')` and other accesses type-check without casts or `any`.
- [ ] Any shared types live under `src/common/types/`; any Zod schema uses `z.infer`.
- [ ] No import of the removed `.js` files remains (search the tree).

## Notes / gotchas

- Other modules still importing `#/config.js` continue to work: under `NodeNext` the `.js`
  specifier resolves to `config.ts`. **Do not** change those specifiers to `.ts`.
- `strictNullChecks` may surface `null` handling around nullable config fields (e.g.
  `serviceVersion` default `null`) — narrow or type as `string | null`, don't cast.
- Keep the convict schema semantics byte-for-byte identical; this step is a **type** conversion,
  not a behaviour change.

➡️ Next: [`04-server-and-plugins.md`](./04-server-and-plugins.md)
