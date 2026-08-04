# Step 08 — API Documentation (OpenAPI / Swagger)

> **Prerequisite:** [`07-tests-migration.md`](./07-tests-migration.md) complete (entire codebase,
> including tests, is TypeScript and green).

## Goal

Add self-serve API documentation for the now-typed HTTP contract using **hapi-swagger** (which
generates an OpenAPI/Swagger UI from the Hapi routes and their **Joi** validation schemas). Since
routes already use Joi (step 05), the schemas double as the documentation source — no duplication.

## Prerequisites / starting state

- Hapi server with typed routes; `GET /health`, `GET /example`, `GET /example/{exampleId}`.
- Joi validation on `example/{exampleId}` params.
- Plugins registered in `server.ts`; routes registered via `router.ts`.

## Context — files you will touch

- `package.json` — add docs dependencies.
- `src/server.ts` — register the docs plugins.
- Route files — add `tags`, `description`, and `response`/`validate` metadata for richer docs.
- Optionally `config.ts` — a flag to toggle docs per environment.

## Instructions

### 1. Install documentation dependencies

`hapi-swagger` needs `@hapi/inert` and `@hapi/vision` to serve the Swagger UI assets/views.

```bash
npm install hapi-swagger @hapi/inert @hapi/vision
npm install -D @types/hapi__inert @types/hapi__vision
```

> Check whether `hapi-swagger` bundles its own types; if not, add an ambient declaration rather
> than using `any`. Verify `@types/hapi__*` are needed (some ship types).

### 2. Register the Swagger plugins in `server.ts`

Add inert, vision, and hapi-swagger to the `server.register([...])` call, with typed options.

```ts
import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import HapiSwagger from 'hapi-swagger'
import type { RegisterOptions } from 'hapi-swagger'
import { config } from '#/config.js'

const swaggerOptions: RegisterOptions = {
  info: {
    title: 'APHA Incubator Backend POC API',
    version: config.get('serviceVersion') ?? '0.0.0'
  },
  documentationPath: '/documentation',
  grouping: 'tags'
}

await server.register([
  // ...existing plugins...
  Inert,
  Vision,
  { plugin: HapiSwagger, options: swaggerOptions }
])
```

- Register these **before or alongside** `router` so routes are picked up.
- Keep the existing plugin registration order for the functional plugins; add the docs trio in a
  sensible position (typically after the core plugins, with `router`).

### 3. Annotate routes for good docs

Enrich each route's `options` with `tags: ['api']`, a `description`/`notes`, and — where useful —
a documented success `response` schema (Joi). This makes the generated OpenAPI meaningful.

```ts
{
  method: 'GET',
  path: '/example/{exampleId}',
  options: {
    tags: ['api'],
    description: 'Fetch a single example record by its example id',
    validate: { params: exampleParamsSchema },
    response: {
      status: {
        200: Joi.object({ exampleId: Joi.string(), name: Joi.string() }),
        404: Joi.any()
      }
    }
  },
  handler: /* ... */
}
```

- Only routes tagged `['api']` appear in the docs (per `grouping`/tag config).
- Consider whether `/health` should be documented or excluded (commonly excluded/`tags: ['health']`).
- Keep `response` schemas accurate to what handlers actually return.

### 4. (Optional) Environment gating

Expose docs only where appropriate. Add a config flag (convict) like `enableSwagger` (default on
in non-production) and conditionally register the docs plugins. Keep it simple; document the default.

### 5. (Optional) Export the OpenAPI spec

`hapi-swagger` serves the raw spec at `/swagger.json` by default. If the team wants a committed
spec artifact, add a script/route to write it out — but do not over-engineer; the served endpoint
usually suffices.

## Acceptance criteria

- [ ] `hapi-swagger`, `@hapi/inert`, `@hapi/vision` (and any needed `@types`) are in `package.json`.
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test` all pass.
- [ ] `npm run build` succeeds; running the app (`docker compose up` / `node dist`): - `GET /documentation` serves the Swagger UI (HTTP `200`, HTML). - `GET /swagger.json` returns a valid OpenAPI/Swagger JSON document. - The `example` routes appear, showing the `exampleId` param derived from the Joi schema.
- [ ] Existing endpoints still behave exactly as before (health/example unchanged functionally).
- [ ] No `any`; docs options typed via `hapi-swagger`'s `RegisterOptions`.

## Notes / gotchas

- `hapi-swagger` reads **Joi** schemas — this is another reason route validation must stay Joi
  (Zod would not feed the generator).
- Serving UI assets requires **both** `@hapi/inert` (static files) and `@hapi/vision` (templates);
  registering hapi-swagger without them fails at boot.
- Keep the docs plugin registration idempotent with the CDP platform's expectations — it should not
  interfere with `/health` used by the platform healthcheck.
- This step adds a new dependency surface; flag it for review per `AGENTS.md` security guidance.

➡️ Next: [`09-final-verification-and-cleanup.md`](./09-final-verification-and-cleanup.md)
