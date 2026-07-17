# Step 00 — Conversion Overview & Ground Rules

> **This is not an executable step.** It sets the non-negotiable rules that every later step
> obeys. Read it fully before running step 01, and keep it open as a reference.

## Goal

Establish the shared context, constraints, and "definition of done" for converting the
`apha-incubator-backend-poc` service from JavaScript (ESM) to TypeScript — compiled with `tsc`
to `dist/`, one verifiable phase at a time.

## The prompt (paste to your agent as project context)

> You are converting an existing Defra CDP **hapi.js** backend service from JavaScript (ESM) to
> **TypeScript**. Work **one numbered prompt at a time**, in order. After each step the codebase
> must remain **green** — it compiles (`npx tsc --noEmit`), lints, formats, and all tests pass.
> Do not begin the next step until the current step's Acceptance Criteria are met. Obey the
> ground rules below at all times. Ask the user before any git commit or push.

## Ground rules (apply to every step)

### Execution & build model
- TypeScript is compiled with **`tsc` to `dist/`**. There is an explicit build step.
- **Production** runs the compiled JavaScript (`node dist`); **development** uses watch mode.
- `dist/` is a build artifact: git-ignored, never hand-edited.

### Allowed TypeScript subset (from `AGENTS.md`)
| Feature | Allowed |
| --- | --- |
| `strict: true` | ✅ Required |
| Type inference | ✅ Always |
| Parameter & return type annotations | ✅ Always |
| Interfaces / type aliases | ✅ Always |
| Union types | ✅ Always |
| Optional properties (`?`) | ✅ Yes |
| Utility types (`Partial`, `Pick`, `Omit`) | ✅ When appropriate |
| JSDoc | ✅ Always (on all exports) |
| Generics | ✅ Only when a library requires it (e.g. `z.infer`) |
| Conditional types | ❌ No |
| Mapped types | ❌ No |
| Decorators | ❌ Avoid unless a framework requires |
| Declaration merging | ❌ No (one sanctioned exception: augmenting Hapi types for plugin decorations) |
| `any` | ❌ Never — use `unknown` and narrow |

See [`../typescript-guide.md`](../typescript-guide.md) for explanations and examples of each.

### Validation boundaries — do not mix
- **Joi** for all Hapi route validation (`validate.payload/params/query/headers`).
- **Zod** for domain/internal runtime types; derive types with `z.infer`.

### Modelling & style
- Modelling preference: **Zod schema → `type` alias → `interface`**.
- Filenames **kebab-case**; types/interfaces **PascalCase**; values **camelCase**.
- ESM with `moduleResolution: NodeNext` — **import specifiers keep the `.js` extension** even
  from `.ts` files. Prefer the `#/` alias for `src` imports. Use `import type` for type-only imports.
- JSDoc on every exported function, interface, and type alias (don't restate types in JSDoc).

### Cross-cutting concerns (must not regress)
- **Logging:** keep ECS-compliant Pino output. If you touch logging, use the `ecs-logging` skill.
- **Metrics:** via `@defra/cdp-metrics` only.
- **Config:** convict remains the config mechanism.
- **Container-first:** verify runtime behaviour with `docker compose build` / `up`, not only
  local Node.

## Conversion sequence (why this order)

Infrastructure first, then leaf-to-root through the app, so it always builds:

1. **01** Docker + dependencies + `tsconfig` + npm scripts — the container can build/run TS.
2. **02** ESLint / Prettier / Vitest / `tsc` type-check — quality gates understand `.ts`.
3. **03** Config + shared types + first Zod schema — a typed foundation.
4. **04** Server + `index` + plugins — composition root & cross-cutting concerns.
5. **05** Routes (Joi) — the HTTP boundary.
6. **06** Services (Zod domain models) — domain logic & data access.
7. **07** Tests migrated to `.ts` in `test/`.
8. **08** API documentation (OpenAPI/Swagger).
9. **09** Final full-stack verification & cleanup.

## Definition of done (whole migration)

- No `.js` source files remain under `src/` (only `.ts`; `dist/` holds emitted `.js`).
- `npx tsc --noEmit` passes with **0 errors**, `strict: true`.
- `npm run lint`, `npm run format:check`, and `npm run test` (with coverage) all pass.
- `docker compose build` succeeds and `docker compose up` serves `GET /health` → `200`.
- No `any`; validation boundaries respected (Joi at HTTP, Zod for domain).
- Exported APIs carry JSDoc; an ADR records the TypeScript adoption decision.

## Acceptance criteria for this step

- [ ] You (or the agent) can restate: the build model (`tsc`→`dist/`), the allowed TS subset,
      the Joi-vs-Zod boundary, and the "keep it green" rule.
- [ ] You have read [`../typescript-guide.md`](../typescript-guide.md).
- [ ] Ready to proceed to [`01-docker-and-dependencies.md`](./01-docker-and-dependencies.md).
