# Adopting TypeScript

## Status

Accepted

## Context

This service started life as a JavaScript-first CDP Node.js backend template (Hapi.js,
ESM modules, Joi for HTTP validation, Vitest for tests). As the service grows, plain
JavaScript gives no compile-time guarantee that request handlers, plugins, config, and
domain data actually match the shapes the code assumes — errors only surface at runtime
or in tests. There was a desire for:

- A documented, enforceable contract for function signatures, config shape, and domain
  data, checked automatically before code ships.
- Better editor tooling (autocomplete, refactoring, inline type errors) for contributors.
- A conversion path that could be done incrementally and verified step-by-step, rather
  than a risky big-bang rewrite, given this is a running service with Docker/CDP platform
  constraints (health checks, `PORT` env var, ECS-compliant logging, metrics).

A phased conversion kit (`conversion/prompts/00`–`09`) was used to convert the service
file-by-file: tooling first, then config/types, server/plugins, routes, services, tests,
API docs, and finally full verification — committing and validating after each step.

## Decision

We will convert the service from JavaScript to TypeScript, compiled with `tsc`, using a
deliberately restricted subset of TypeScript features (see `AGENTS.md`) rather than the
full language surface:

- **Build model:** `tsc` compiles `src/**/*.ts` to `dist/**/*.js` for production; `tsx
watch` runs the TypeScript source directly (no build step) for local development. The
  Docker `development` stage runs `tsx`; the `production` stage runs the compiled
  `dist/` output only (no TypeScript tooling present).
- **Strictness:** `strict: true` is required, `any` is never used (`unknown` with
  explicit narrowing instead), and only a documented allowlist of TypeScript features may
  be used (type inference, interfaces/type aliases, unions, optional properties, utility
  types, generics where a library requires them, JSDoc). No conditional types, mapped
  types, decorators, or declaration merging.
- **Validation boundary split:** Joi continues to validate all Hapi route
  payload/params/query/headers (the HTTP boundary), while Zod is used for internal
  domain/service-layer types and is the pattern for new domain models
  (`z.infer<typeof schema>`).
- **Types for dependencies:** native/published `@types/*` packages are used where they
  exist (e.g. `@types/convict`); for internal or third-party packages that ship no types
  and have no published `@types/*` (`@defra/hapi-tracing`, `@defra/hapi-secure-context`,
  `@defra/cdp-metrics`), minimal hand-written ambient `.d.ts` declarations are added under
  `src/@types/`. A single sanctioned `declare module '@hapi/hapi'` augmentation
  (`src/@types/hapi.d.ts`) types the `db`/`mongoClient`/`locker` server decorations that
  are actually consumed in code.
- **API documentation:** `hapi-swagger` (with `@hapi/inert`/`@hapi/vision`) generates
  interactive documentation and a raw OpenAPI spec directly from the existing Joi route
  schemas, served at `/documentation` and `/swagger.json`.
- **Tests:** all tests are migrated to TypeScript under `test/**/*.ts` (mirroring
  `src/`'s structure, separate from source per `AGENTS.md`), type-checked via a dedicated
  `tsconfig.test.json` and the `typecheck:test` script.

## Consequences

**Positive:**

- Function signatures, Hapi route/plugin registrations, config, and domain data now have
  compile-time enforced shapes; `npm run typecheck` catches type errors before code ships.
- API documentation (`/documentation`, `/swagger.json`) is generated directly from the
  Joi schemas that already validate requests, so the docs cannot silently drift from the
  actual validation behaviour.
- Editor tooling (autocomplete, inline errors, safe renames) is significantly improved
  for contributors.
- The restricted feature subset keeps the codebase approachable and avoids the more
  exotic/hard-to-read corners of TypeScript (conditional/mapped types, decorators).

**Negative / trade-offs:**

- An explicit build step (`tsc` → `dist/`) is now required for production; the `dist/`
  output must be excluded from git (`.gitignore`) and Docker context in dev
  (`.dockerignore`), and CI/CD must build it.
- `@types/*` packages (and any hand-written ambient declarations under `src/@types/`)
  are an additional maintenance surface that must be kept in sync with the packages they
  describe.
- One new dependency conflict had to be worked around: `hapi-swagger@17.3.2` (latest
  published version) declares a peer dependency on `joi@"17.x"`, but this service already
  runs `joi@18.2.1`. Rather than relaxing peer-dependency enforcement globally, a scoped
  `package.json` `"overrides"` entry (`"hapi-swagger": { "joi": "$joi" }`) pins
  hapi-swagger's internal joi resolution to the project's own joi version, keeping peer
  checks strict for every other package. This should be revisited if/when hapi-swagger
  (or an alternative Hapi OpenAPI plugin) publishes joi 18 support.
- Contributors must follow the documented allowed-TypeScript-feature subset in
  `AGENTS.md`; anything beyond it requires explicit sign-off, which is a small extra
  review overhead compared to unrestricted JavaScript.

**Neutral:**

- Two Node ESM module-resolution quirks were addressed as part of this decision and are
  worth noting for future maintainers: (1) plain `node` cannot resolve `.js` import
  specifiers to sibling `.ts` files, which is why local/dev runs use `tsx` rather than
  `node ./src` directly; (2) the `#/` subpath import alias in `package.json` `"imports"`
  is now conditional (`development` → `./src/*`, `default` → `./dist/*`) so the same
  source resolves correctly whether run via `tsx --conditions=development` in
  development/Docker-dev, or via plain `node dist` in production.
