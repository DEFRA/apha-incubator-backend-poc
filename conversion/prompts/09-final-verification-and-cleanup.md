# Step 09 — Final Verification & Cleanup

> **Prerequisite:** [`08-api-documentation.md`](./08-api-documentation.md) complete (API docs
> served). This is the final step — it proves the whole migration and tidies up.

## Goal

Verify the fully converted TypeScript service end-to-end (build, quality gates, and a
containerised runtime smoke test), remove any JavaScript leftovers, record the decision as an
ADR, and prepare the change for review.

## Prerequisites / starting state

- All `src/` source and `test/` tests are TypeScript.
- `tsc` builds to `dist/`; Docker prod stage runs `node dist`.
- Lint/format/test/typecheck understand `.ts`; API docs are served.

## Instructions

### 1. Full clean build from scratch

```bash
rm -rf dist coverage node_modules .eslintcache *.tsbuildinfo
npm ci
npm run build            # tsc → dist/, must succeed with 0 errors
```

Confirm `dist/` contains the compiled JS mirroring `src/` (including `dist/index.js`).

### 2. Run every quality gate (the order from AGENTS.md)

```bash
npm run format:check     # 1. Prettier
npm run lint             # 2. ESLint (incl. no-explicit-any)
npm run typecheck        # tsc --noEmit, strict, 0 errors
npm run typecheck:test   # if step 07 option A was chosen
npm run test             # 3. Vitest with coverage, all green
```

All must pass. Fix any failures before proceeding — do not ship a red gate.

### 3. Containerised runtime smoke test (container-first)

```bash
docker compose build
docker compose up -d
# wait for healthy, then:
curl -sf http://localhost:3001/health           # → 200 {"message":"success"}
curl -sf http://localhost:3001/example          # → 200 array
curl -sf http://localhost:3001/documentation    # → 200 Swagger UI (from step 08)
curl -sf http://localhost:3001/swagger.json     # → 200 OpenAPI JSON
docker compose down
```

Also verify the **production** image path (compiled `dist/`), e.g. build the `production` target
and confirm it starts and serves `/health`:

```bash
docker build --target production -t apha-poc:prod .
docker run --rm -e PORT=3001 -p 3001:3001 apha-poc:prod &
curl -sf http://localhost:3001/health
```

(Production needs Mongo etc.; if the healthcheck requires dependencies, run via `docker compose`
with the production target instead. Adapt to how CDP expects the prod image to run.)

### 4. Remove JavaScript leftovers

- [ ] No `.js` files remain under `src/` (only `.ts` and `.d.ts`). Search and remove/convert any
      stragglers. `dist/**/*.js` is expected (build output) and git-ignored.
- [ ] `main` in `package.json` points at `dist/index.js`.
- [ ] `.gitignore` ignores `dist/`, `coverage/`, `*.tsbuildinfo`; `.dockerignore` ignores `dist/`
      and `node_modules/`.
- [ ] No dead scripts referencing the old JS entrypoints (`node ./src`); dev/start use `tsx`/`dist`.
- [ ] `.vite/` setup files are either `.ts` or intentionally left `.js` (documented).
- [ ] `neostandard`/ESLint config no longer needs JS-only assumptions; lint globs cover `.ts`.

### 5. Documentation & housekeeping

- Update `README.md` with the new TypeScript workflow: `npm run build`, `npm run typecheck`,
  `npm run dev` (tsx watch), how docs are served, and that production runs `dist/`.
- Ensure exported functions/interfaces/types carry JSDoc (spot-check per `AGENTS.md`).
- Confirm ECS logging output is unchanged (structured under `event.*`/`error.*`), and metrics still
  flow via `@defra/cdp-metrics`.

### 6. Record an ADR

Capture the decision to adopt TypeScript (a significant, hard-to-reverse choice). **Use the
`create-adr` skill** — do not hand-roll the shape. Suggested filename:
`adr/adopting-typescript.adr.md`, status `Accepted`, covering:

- **Context:** JS-first CDP service; desire for type safety and a documented contract.
- **Decision:** Convert to TypeScript compiled with `tsc` to `dist/`; restricted TS subset;
  Joi at HTTP boundary, Zod for domain types; native `@types`; hapi-swagger for docs.
- **Consequences:** explicit build step; `@types` maintenance; stronger contracts; docs generated
  from Joi; team must follow the allowed-subset rules.

### 7. Prepare the pull request

- Branch per `AGENTS.md` naming (e.g. `feat/aphai-xxx/convert-to-typescript`).
- Conventional Commit messages.
- **Ask the user before any commit or push** (repo rule). Consider using the
  `create-pr-from-changes` skill to generate the PR.
- PR description should summarise the phased conversion and link this `conversion/` kit.

## Acceptance criteria (definition of done for the whole migration)

- [ ] `npm ci && npm run build` succeeds from a clean checkout (0 `tsc` errors, `strict: true`).
- [ ] `format:check`, `lint`, `typecheck` (+ `typecheck:test`), and `test` (with coverage) all pass.
- [ ] `docker compose build` + `up` serve `/health` `200`, `/example`, `/documentation`, and
      `/swagger.json`.
- [ ] The **production** Docker target runs from `dist/` and serves `/health`.
- [ ] No `.js` source files under `src/`; all tests are `.ts` under `test/`.
- [ ] No `any` anywhere; Joi at the HTTP boundary, Zod for domain models.
- [ ] `README.md` updated; exported APIs have JSDoc; ECS logging and metrics intact.
- [ ] ADR recorded via the `create-adr` skill.
- [ ] PR prepared (after user approval to commit/push).

## Notes / gotchas

- If any gate is red, the migration is **not** done — resolve before opening the PR.
- Watch for CDP platform assumptions: the healthcheck curl in the prod image, the `PORT` env, and
  ECS log shape must all be preserved.
- Keep `dist/` out of git; the CI/CD pipeline builds it. Only commit source (`.ts`) and config.
- If new dependencies (`hapi-swagger`, `@types/*`, `zod`, `typescript`, `tsx`) need sign-off, flag
  them in the PR per the security/dependency guidance in `AGENTS.md`.

🎉 That completes the JavaScript → TypeScript conversion. See the kit index:
[`../README.md`](../README.md).
