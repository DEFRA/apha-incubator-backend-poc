# Step 06 — Services & Domain Models (Zod)

> **Prerequisite:** [`05-routes-and-validation.md`](./05-routes-and-validation.md) complete
> (routes typed, Joi validation at the HTTP boundary).

## Goal

Convert the service layer to TypeScript and introduce **Zod** domain schemas with `z.infer`
types for data crossing the database boundary. Type the MongoDB access (`Db`, typed collections)
so services return well-defined domain types instead of untyped documents.

## Prerequisites / starting state

- `src/services/ExampleFind.js` — `findAllExampleData(db)` and `findExampleData(db, id)`; query
  the `example-data` collection, project out `_id`.
- Filename is PascalCase (`ExampleFind.js`) — must become kebab-case `example-find.ts`.
- Routes (step 05) import these functions; the mongodb plugin (step 04) provides a typed `Db`.

## Context — files you will touch

- **Rename:** `src/services/ExampleFind.js` → `src/services/example-find.ts`
- **New:** `src/services/example-data.ts` — Zod schema + inferred `ExampleData` type (if not
  already created in step 03).
- Update the import in `src/routes/example.ts` to `#/services/example-find.js` if not already.

## Instructions

### 1. Define the domain model with Zod

Create (or finalise) `src/services/example-data.ts`. The Zod schema is the single source of truth
for the record's runtime validation **and** its static type.

```ts
import { z } from 'zod'

/** Runtime schema for a record in the `example-data` collection. */
export const exampleDataSchema = z.object({
  exampleId: z.string(),
  name: z.string()
})

/** Static type for an example record, derived from {@link exampleDataSchema}. */
export type ExampleData = z.infer<typeof exampleDataSchema>
```

> Adjust fields to the collection's real shape. Use Zod for this domain type — **not** Joi (Joi
> stays at the HTTP boundary from step 05).

### 2. Rename and convert the service

Rename `ExampleFind.js` → `example-find.ts`. Add types and JSDoc; type the Mongo collection with
the domain type so results are `ExampleData`.

```ts
import type { Db } from 'mongodb'
import type { ExampleData } from '#/services/example-data.js'

/**
 * Retrieves all example records, with the internal Mongo `_id` projected out.
 *
 * @param db - The Mongo database handle from the request.
 * @returns All example records.
 */
export function findAllExampleData(db: Db): Promise<ExampleData[]> {
  return db
    .collection<ExampleData>('example-data')
    .find({}, { projection: { _id: 0 } })
    .toArray()
}

/**
 * Retrieves a single example record by its example id.
 *
 * @param db - The Mongo database handle from the request.
 * @param id - The `exampleId` to look up.
 * @returns The matching record, or `null` if none exists.
 */
export function findExampleData(
  db: Db,
  id: string
): Promise<ExampleData | null> {
  return db
    .collection<ExampleData>('example-data')
    .findOne({ exampleId: id }, { projection: { _id: 0 } })
}
```

Notes on the Mongo typings:

- `collection<ExampleData>(...)` makes `find`/`findOne` return the domain type.
- `findOne` returns `T | null` — keep the `| null` in the signature; the route already narrows it.
- Projecting `_id` out is compatible with typing the collection as `ExampleData` (which has no
  `_id`). If TypeScript complains about the projection/document shape, prefer a precise return
  type over casting; only use a narrow, commented assertion if the driver's generics are too
  strict — never `any`.

### 3. Validate at the boundary where appropriate

Where data genuinely crosses an untrusted boundary (e.g. an external API response, not our own
DB), parse it with the Zod schema (`exampleDataSchema.parse(...)`) so runtime shape is enforced.
For trusted internal reads you may rely on the typed collection; document the assumption. Do not
sprinkle `.parse()` everywhere — apply it at real trust boundaries.

### 4. Fix up imports

- Ensure `src/routes/example.ts` imports `#/services/example-find.js` (post-rename).
- Search the tree for any remaining reference to `ExampleFind` and update it.

## Acceptance criteria

- [ ] `src/services/example-find.ts` exists (kebab-case); `ExampleFind.js` is gone.
- [ ] `src/services/example-data.ts` exports `exampleDataSchema` and `ExampleData` via `z.infer`.
- [ ] Services return typed domain values (`ExampleData` / `ExampleData[]` / `ExampleData | null`).
- [ ] No import references the old `ExampleFind` path.
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` pass.
- [ ] `npm run test` passes.
- [ ] Runtime smoke test still green: `GET /example` returns an array, `GET /example/{id}` returns
      a record or `404`.
- [ ] No `any`; domain modelling uses Zod (not Joi, not bare interfaces).

## Notes / gotchas

- Keep query behaviour identical — this is a typing conversion, not a query change.
- `findOne`'s `null` result must remain `null` (not `undefined`) to match the driver and the
  route's existing `if (!entity)` narrowing.
- If future services validate external inputs, that's the place for `schema.parse()`; internal DB
  reads can trust the typed collection.
- After this step, **all of `src/` should be TypeScript except tests** — the next step migrates those.

➡️ Next: [`07-tests-migration.md`](./07-tests-migration.md)
