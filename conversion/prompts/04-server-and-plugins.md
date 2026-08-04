# Step 04 — Server, Bootstrap & Hapi Plugins

> **Prerequisite:** [`03-config-and-types-foundation.md`](./03-config-and-types-foundation.md)
> complete (typed `config.ts` and shared-types foundation in place).

## Goal

Convert the composition root and all cross-cutting Hapi plugins to TypeScript: `server.ts`,
`index.ts`, `start-server.ts`, and everything under `src/plugins/`. Introduce **Hapi type
augmentation** so the request/server **decorations** added by the mongodb plugin (`request.db`,
`server.locker`, etc.) are known to the type-checker — the one sanctioned use of module
augmentation in this project.

## Prerequisites / starting state

- `src/index.js` — bootstraps via `startServer()`, handles `unhandledRejection`.
- `src/common/helpers/start-server.js` — creates and starts the server, logs the URL.
- `src/server.js` — builds the Hapi server and registers plugins:
  `requestLogger`, `requestTracing`, `metrics`, `secureContext`, `pulse`, `mongoDb`, `router`.
- `src/plugins/`: `router.js`, `mongodb.js`, `pulse.js`, `request-logger.js`,
  `request-tracing.js`, `logger-options.js` (+ `mongodb.test.js`).
- `src/common/helpers/logging/logger.js` — Pino logger factory (ECS).
- `mongodb.js` decorates `server`/`request` with `mongoClient`, `db`, `locker`.

## Context — files you will touch

- `src/server.js` → `.ts`
- `src/index.js` → `.ts`
- `src/common/helpers/start-server.js` → `.ts`
- `src/common/helpers/fail-action.js` (+ test) → `.ts`
- `src/common/helpers/logging/logger.js` → `.ts`
- `src/common/helpers/mongo-lock.js` → `.ts`
- `src/plugins/*.js` → `.ts`
- **New:** `src/@types/hapi.d.ts` (or `src/types/hapi-augmentation.d.ts`) — Hapi type augmentation.

## Instructions

### 1. Type the Hapi server and bootstrap

Convert `server.js` → `server.ts`. Type the factory's return and use Hapi's own types.

```ts
import Hapi, { type Server } from '@hapi/hapi'
// ...existing imports, keeping `.js` specifiers...

/**
 * Builds the Hapi server, registers all plugins, and returns it (not yet started).
 *
 * @returns A configured, unstarted Hapi server instance.
 */
export async function createServer(): Promise<Server> {
  const server = Hapi.server({
    host: config.get('host'),
    port: config.get('port')
    // ...unchanged options...
  })

  await server.register([
    requestLogger,
    requestTracing,
    metrics,
    secureContext,
    pulse,
    { plugin: mongoDb, options: config.get('mongo') },
    router
  ])

  return server
}
```

Convert `index.js` → `index.ts` (type the `unhandledRejection` handler's error as `unknown` and
narrow — see the guide §5) and `start-server.js` → `start-server.ts` (return `Promise<Server>`).

### 2. Augment Hapi types for plugin decorations

The mongodb plugin adds `db`, `mongoClient`, `locker` to `server` and `db`, `locker` to `request`.
Declare these so consumers (routes/services) type-check. Create a declaration file:

```ts
// src/@types/hapi.d.ts
import 'ipaddr.js' // ensure this file is treated as a module if needed
import type { Db, MongoClient } from 'mongodb'
import type { LockManager } from 'mongo-locks'

declare module '@hapi/hapi' {
  interface ServerApplicationState {}

  interface Server {
    mongoClient: MongoClient
    db: Db
    locker: LockManager
  }

  interface Request {
    db: Db
    locker: LockManager
  }
}
```

- Ensure `tsconfig.json` `include` picks up `src/**/*.ts` **and** `.d.ts` files (the `src/**/*.ts`
  glob covers `.d.ts` under `src`; confirm the file is inside `src`).
- This is **module augmentation of a library type**, explicitly permitted by `AGENTS.md` for this
  purpose. Do not use declaration merging elsewhere.

### 3. Convert each plugin

For every file in `src/plugins/`, rename to `.ts` and type the Hapi plugin object and its
`register` function. Hapi plugins are `Plugin<Options>` with a typed `register(server, options)`.

```ts
// src/plugins/router.ts
import type { Server } from '@hapi/hapi'
import { health } from '#/routes/health.js'
import { example } from '#/routes/example.js'

export const router = {
  plugin: {
    name: 'router',
    register: (server: Server): void => {
      server.route([health, ...example])
    }
  }
}
```

```ts
// src/plugins/mongodb.ts — type options and the decorations
import { MongoClient, type Db } from 'mongodb'
import { LockManager } from 'mongo-locks'
import type { Server } from '@hapi/hapi'
import type { MongoConfig } from '#/common/types/index.js'

export const mongoDb = {
  plugin: {
    name: 'mongodb',
    version: '1.0.0',
    register: async (server: Server, options: MongoConfig): Promise<void> => {
      // ...unchanged logic, now typed; `db: Db`, decorations match the augmentation...
    }
  }
}

async function createIndexes(db: Db): Promise<void> {
  // ...unchanged...
}
```

Apply the same treatment to `pulse.ts`, `request-logger.ts`, `request-tracing.ts`, and
`logger-options.ts`. Keep ECS logging output identical — if you change any log shape, use the
`ecs-logging` skill rather than hand-rolling.

### 4. Convert supporting helpers

- `logging/logger.ts` — type the Pino logger factory's return (`import type { Logger } from 'pino'`).
- `fail-action.ts` — type the Hapi `failAction` signature
  (`(request: Request, h: ResponseToolkit, err?: Error) => ...`).
- `mongo-lock.ts` — type against `mongo-locks`.

### 5. Switch the dev container to `tsx` (if deferred in step 01)

If step 01 left the dev command on `node --watch ./src`, now repoint `server:watch` to
`tsx watch ./src/index.ts` so the dev container boots the TypeScript app. Rebuild the dev image.

## Acceptance criteria

- [ ] `server.ts`, `index.ts`, `start-server.ts`, all `src/plugins/*.ts`, and the listed helpers
      exist; their `.js` originals are removed.
- [ ] `src/@types/hapi.d.ts` declares the `db`/`locker`/`mongoClient` decorations; using
      `request.db` / `server.locker` type-checks without casts.
- [ ] `npm run typecheck` passes with **0 errors**.
- [ ] `npm run lint` and `npm run format:check` pass.
- [ ] `npm run test` passes (including `mongodb.test` converted or still running).
- [ ] `npm run build` emits `dist/`, and `node dist` (or `docker compose up`) **starts the server**
      and `GET /health` returns `200`.
- [ ] `docker compose up` boots the dev container running the TypeScript app; logs remain ECS-shaped.

## Notes / gotchas

- Keep all import specifiers as `.js` (NodeNext resolves them to `.ts`). Do not rewrite to `.ts`.
- Registering plugins in the same order matters — do not reorder `server.register([...])`.
- If a `@hapi/*` or `@defra/*` plugin lacks bundled types and no `@types` exists, add a **minimal**
  ambient declaration rather than casting to `any`.
- This is the first step where the running app is fully TypeScript end-to-end — do the
  `docker compose up` smoke test, not just a local build.

➡️ Next: [`05-routes-and-validation.md`](./05-routes-and-validation.md)
