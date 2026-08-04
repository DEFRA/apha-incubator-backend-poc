# TypeScript Conversion Kit

This folder contains everything needed to iteratively convert the
`apha-incubator-backend-poc` service from JavaScript (ESM) to **TypeScript**, one safe,
verifiable step at a time.

It is an **authoring kit**, not a script. Nothing here changes the service on its own — you
(or an AI agent) run the prompt files in order, verifying each step before moving to the next.

## What's inside

| File                                                                                             | Purpose                                                                                         |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [`typescript-guide.md`](./typescript-guide.md)                                                   | A thorough guide to core TypeScript features for Node.js developers new to TS. Read this first. |
| [`prompts/00-conversion-overview.md`](./prompts/00-conversion-overview.md)                       | Ground rules, the allowed TS subset, and the definition of done. Read before running any step.  |
| [`prompts/01-docker-and-dependencies.md`](./prompts/01-docker-and-dependencies.md)               | Docker, Docker Compose, `tsconfig.json`, TS dependencies, npm scripts.                          |
| [`prompts/02-tooling-lint-format-test.md`](./prompts/02-tooling-lint-format-test.md)             | ESLint, Prettier, Vitest, and `tsc` type-checking wired for `.ts`.                              |
| [`prompts/03-config-and-types-foundation.md`](./prompts/03-config-and-types-foundation.md)       | `config.ts`, shared types, first Zod schema, `#/` path alias.                                   |
| [`prompts/04-server-and-plugins.md`](./prompts/04-server-and-plugins.md)                         | `server.ts`, `index.ts`, and all Hapi plugins.                                                  |
| [`prompts/05-routes-and-validation.md`](./prompts/05-routes-and-validation.md)                   | Route modules with **Joi** validation and typed handlers.                                       |
| [`prompts/06-services-and-domain-models.md`](./prompts/06-services-and-domain-models.md)         | Service layer with **Zod** domain schemas (`z.infer`).                                          |
| [`prompts/07-tests-migration.md`](./prompts/07-tests-migration.md)                               | Convert tests to `.ts` and align to the `test/` folder.                                         |
| [`prompts/08-api-documentation.md`](./prompts/08-api-documentation.md)                           | OpenAPI/Swagger API documentation endpoint.                                                     |
| [`prompts/09-final-verification-and-cleanup.md`](./prompts/09-final-verification-and-cleanup.md) | Full build/lint/test/docker smoke test, cleanup, ADR, PR.                                       |

## How to use this kit

1. **Read the guide.** Skim [`typescript-guide.md`](./typescript-guide.md) so the TypeScript
   syntax in later steps is familiar.
2. **Read the overview.** [`prompts/00-conversion-overview.md`](./prompts/00-conversion-overview.md)
   sets the non-negotiable rules (allowed TS subset, `no-any`, Joi-vs-Zod boundaries).
3. **Run each prompt in numeric order.** Paste the prompt into your agent (or follow it
   manually). Each prompt is self-contained: it states its goal, prerequisites, the exact
   files to touch, and how to verify success.
4. **Verify before advancing.** Every prompt ends with an **Acceptance Criteria** checklist.
   Do not start step _N+1_ until step _N_'s checklist passes. Every step is designed to leave
   the codebase **green** — it compiles, lints, and tests pass.
5. **Commit per step.** A commit (or PR) per prompt keeps the migration reviewable and easy
   to bisect if something regresses.

## Ordering rationale ("keep it green")

The sequence is deliberately **infrastructure-first, then leaf-to-root through the app**:

```
Docker + build tooling   →  the container can build & run TypeScript at all
        ↓
Lint / format / test     →  the quality gates understand .ts
        ↓
Config + shared types    →  a typed foundation everything imports
        ↓
Server + plugins         →  the composition root and cross-cutting concerns
        ↓
Routes (Joi)             →  the HTTP boundary
        ↓
Services (Zod)           →  domain logic and data access
        ↓
Tests                    →  lock in behaviour in TypeScript
        ↓
API docs                 →  document the now-typed contract
        ↓
Final verification       →  full-stack smoke test + cleanup
```

Each layer depends only on layers converted before it, so the app keeps building at every
step rather than being broken for the whole migration.

## Global conventions (apply to every step)

These come from the repository's [`AGENTS.md`](../AGENTS.md) and hold throughout:

- **Execution model:** TypeScript is compiled with **`tsc` to `dist/`**. Production runs the
  compiled JavaScript (`node dist`); dev uses watch mode. There is an explicit build step.
- **Allowed TS subset only** — see the overview prompt. No `any`, decorators, mapped types,
  conditional types, or declaration merging.
- **Validation boundaries:** **Joi** for Hapi route validation; **Zod** for domain/internal
  runtime types (derive types with `z.infer`).
- **Logging:** keep it ECS-compliant via Pino. **Metrics:** via `@defra/cdp-metrics`.
- **Naming:** kebab-case filenames, PascalCase types/interfaces, camelCase values.
- **Imports:** ESM with `NodeNext` resolution; prefer the `#/` alias for `src` imports.
- **Modelling preference:** Zod schema → `type` alias → `interface`.
- **Container-first verification:** where runtime behaviour matters, verify with
  `docker compose build` / `docker compose up`, not just local Node.
- **Docs don't need tests**, but code does — write/update tests for any behaviour you change.
- **ADRs:** capture significant, hard-to-reverse decisions using the `create-adr` skill.
- **Git:** ask permission before any commit or push (per `AGENTS.md`).
