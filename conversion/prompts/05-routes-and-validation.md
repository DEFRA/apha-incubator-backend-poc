# Step 05 — Routes & HTTP Validation (Joi)

> **Prerequisite:** [`04-server-and-plugins.md`](./04-server-and-plugins.md) complete (server,
> plugins, and Hapi type augmentation in place; the app runs as TypeScript).

## Goal

Convert the route modules to TypeScript with properly typed handlers, and formalise HTTP
validation using **Joi** (the mandated library at the route boundary). The `request.db`
decoration is now typed thanks to step 04's augmentation, so handlers get full type safety.

## Prerequisites / starting state

- `src/routes/health.js` — `GET /health`, returns `{ message: 'success' }`.
- `src/routes/example.js` — `GET /example` and `GET /example/{exampleId}`; uses `request.db`,
  calls `findAllExampleData` / `findExampleData`, returns `Boom.notFound()` when missing.
- Routes are registered by `src/plugins/router.ts` (converted in step 04).
- No route currently declares `validate` schemas.

## Context — files you will touch

- `src/routes/health.js` → `.ts`
- `src/routes/example.js` → `.ts`
- (Service imports stay `.js` specifiers; the services themselves convert in step 06.)

## Instructions

### 1. Convert `health.ts`

Type the route as a Hapi `ServerRoute` and the handler's `request`/`h`.

```ts
import type { ServerRoute, Request, ResponseToolkit } from '@hapi/hapi'

/** Health-check route used by the CDP platform to verify the service is up. */
export const health: ServerRoute = {
  method: 'GET',
  path: '/health',
  handler: (_request: Request, h: ResponseToolkit) =>
    h.response({ message: 'success' })
}
```

### 2. Convert `example.ts` with typed handlers + Joi validation

Type the array as `ServerRoute[]`, type handlers, and add **Joi** validation for the path param.

```ts
import Boom from '@hapi/boom'
import Joi from 'joi'
import type { ServerRoute, Request, ResponseToolkit } from '@hapi/hapi'
import { findAllExampleData, findExampleData } from '#/services/example-find.js'

/** Validates the `exampleId` path parameter for the single-example route. */
const exampleParamsSchema = Joi.object({
  exampleId: Joi.string().required()
})

/** Routes exposing example records from the `example-data` collection. */
export const example: ServerRoute[] = [
  {
    method: 'GET',
    path: '/example',
    handler: async (request: Request, h: ResponseToolkit) => {
      const entities = await findAllExampleData(request.db)
      return h.response(entities)
    }
  },
  {
    method: 'GET',
    path: '/example/{exampleId}',
    options: {
      validate: {
        params: exampleParamsSchema
      }
    },
    handler: async (request: Request, h: ResponseToolkit) => {
      const { exampleId } = request.params as { exampleId: string }
      const entity = await findExampleData(request.db, exampleId)

      if (!entity) {
        return Boom.notFound()
      }

      return h.response(entity)
    }
  }
]
```

- **Joi only** at this boundary — do not use Zod for route validation.
- The project already registers a global `failAction` (see `server.ts`), so invalid params
  produce a 400 automatically. Do not add per-route error handling for validation.
- Typing `request.params`: Hapi types `params` loosely. Prefer a small inline type assertion of
  the **validated** shape (as above) or a typed `Request<ReqRefDefaults>` refinement. Avoid `any`.

### 3. Keep service import specifiers as `.js`

`findAllExampleData` / `findExampleData` still resolve via `.js` specifiers even though the
service file converts to `.ts` in the next step (and may be renamed — see note below).

> **Filename note:** `src/services/ExampleFind.js` is PascalCase, which violates the kebab-case
> filename convention. Step 06 renames it to `example-find.ts`. If you convert routes **before**
> that rename, keep the import pointing at the current filename (`#/services/ExampleFind.js`) and
> update it in step 06. To avoid a dangling import, prefer doing the rename as the first action of
> step 06 and importing `#/services/example-find.js` here. State which order you chose.

## Acceptance criteria

- [ ] `src/routes/health.ts` and `src/routes/example.ts` exist; `.js` originals removed.
- [ ] Handlers are typed with `Request` / `ResponseToolkit`; routes typed as
      `ServerRoute` / `ServerRoute[]`.
- [ ] The `GET /example/{exampleId}` route validates `params` with **Joi**.
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` all pass.
- [ ] `npm run test` passes.
- [ ] Runtime smoke test (via `docker compose up` or `node dist`): - `GET /health` → `200 { "message": "success" }` - `GET /example` → `200` with an array - `GET /example/{unknown-id}` → `404` - An invalid `exampleId` that fails Joi → `400`
- [ ] No `any`; `request.db` is typed (no cast needed) courtesy of step 04's augmentation.

## Notes / gotchas

- Don't over-validate: only add Joi schemas that reflect real constraints. A permissive
  `Joi.string().required()` for the id is appropriate; don't invent formats the data doesn't have.
- If you add `query`/`payload` validation to future routes, keep using Joi and rely on the global
  `failAction`.
- Response typing: Hapi handler return types are flexible; you generally don't annotate the return
  of a handler. Focus typing effort on inputs (`request`) and the service calls.

➡️ Next: [`06-services-and-domain-models.md`](./06-services-and-domain-models.md)
