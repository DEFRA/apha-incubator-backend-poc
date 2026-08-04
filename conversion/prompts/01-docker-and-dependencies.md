# Step 01 — Docker, Docker Compose & TypeScript Dependencies

> **Prerequisite:** [`00-conversion-overview.md`](./00-conversion-overview.md) read and understood.
> **This is the first executable step.** Per the container-first philosophy, we set up the
> build toolchain **before** touching any application code.

## Goal

Make the project able to **build and run TypeScript inside Docker**, without yet converting any
`src` files. By the end, `docker compose build` succeeds, the dev container runs the (still-JS)
app via the TypeScript toolchain, and the production image compiles to `dist/` and runs it.

## Prerequisites / starting state

- Plain JS ESM service. Key infra files: `Dockerfile`, `compose.yml`, `package.json`.
- `package.json` has `"type": "module"`, `"engines": { "node": ">=24" }`, and an `imports` map
  `"#/*": "./src/*"`.
- Current dev command: `node --watch ./src`. Current prod command: `node src`.

## Context — files you will touch

- `package.json` — add TS dev dependencies and `@types`; add/adjust scripts.
- **New:** `tsconfig.json` (repo root).
- `Dockerfile` — dev stage runs TS in watch; prod stage builds to `dist/` and runs it.
- `compose.yml` — ensure the app service volumes/commands work with the TS build.
- `.dockerignore` / `.gitignore` — ignore `dist/` and TS build cache.

## Instructions

### 1. Add TypeScript dependencies (dev)

Install (exact versions resolved by the agent; pin them in `package.json`):

```bash
npm install -D typescript @types/node tsx
npm install -D @types/hapi__hapi @types/hapi__boom
npm install zod
```

- `typescript` — the `tsc` compiler.
- `@types/node` — Node standard-library types (match the Node 24 line).
- `tsx` — fast TS runner for **dev watch mode** only (production uses compiled `dist/`).
- `@types/hapi__hapi`, `@types/hapi__boom` — types for Hapi packages that don't bundle their own
  (verify at install time which `@hapi/*` packages need `@types`; add others as needed in later steps).
- `zod` — runtime schema/validation for domain types (used from step 03 onward).

> Note: some `@hapi/*` and `@defra/*` packages ship their own types. Only add `@types/*` for those
> that don't. Do not add types you don't need.

### 2. Create `tsconfig.json` at the repo root

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": false,
    "resolveJsonModule": true,
    "paths": {
      "#/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "test", "coverage"]
}
```

`paths` mirrors the `package.json` `imports` alias so the type-checker resolves `#/` the same way
Node does. (Tests get their own handling in step 02/07.)

### 3. Update `package.json` scripts

Add a build/typecheck pipeline and repoint start/dev. Keep existing script names where the
platform relies on them (`dev`, `start`, `docker:dev`).

```jsonc
{
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "dev": "AWS_EMF_ENVIRONMENT=Local NODE_ENV=development npm run server:watch",
    "server:watch": "tsx watch --inspect=0.0.0.0 --env-file-if-exists=.env ./src/index.ts",
    "server:debug": "tsx watch --inspect-brk=0.0.0.0 --env-file-if-exists=.env ./src/index.ts",
    "docker:dev": "npm run dev",
    "start": "NODE_ENV=production node ./dist/index.js --env-file-if-exists=.env"
  }
}
```

> At this point `src/index.ts` does not exist yet (the app is still `.js`). That's expected — the
> **dev** container command won't fully boot until step 03/04 converts `index`/`server`. This
> step's success is measured by the **build** and the **production image compiling**, plus the
> toolchain being wired. If you prefer the dev container to keep booting the JS app until step 04,
> temporarily keep `server:watch` pointing at `./src` with `node --watch` and switch it to `tsx`
> in step 04 — state which choice you made in your commit.

Update the `main` field to reflect the compiled entry once conversion completes (defer the final
value to step 09 if the JS entry must keep working meanwhile):

```jsonc
{ "main": "dist/index.js" }
```

### 4. Update the `Dockerfile`

The production stage must run `npm run build` (producing `dist/`) and start from `dist/`. Keep
the two-stage structure and the CDP healthcheck curl.

```dockerfile
ARG PARENT_VERSION=3.0.5-node24.14.1
ARG PORT=3000
ARG PORT_DEBUG=9229

FROM defradigital/node-development:${PARENT_VERSION} AS development
ARG PARENT_VERSION
LABEL uk.gov.defra.ffc.parent-image=defradigital/node-development:${PARENT_VERSION}
ARG PORT
ARG PORT_DEBUG
ENV PORT=${PORT}
EXPOSE ${PORT} ${PORT_DEBUG}

COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node ./src ./src
CMD [ "npm", "run", "docker:dev" ]

FROM defradigital/node-development:${PARENT_VERSION} AS build
ARG PARENT_VERSION
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node ./src ./src
RUN npm run build

FROM defradigital/node:${PARENT_VERSION} AS production
ARG PARENT_VERSION
LABEL uk.gov.defra.ffc.parent-image=defradigital/node:${PARENT_VERSION}

# CDP PLATFORM HEALTHCHECK REQUIREMENT
USER root
RUN apk add --no-cache curl
USER node

COPY --from=build /home/node/package*.json ./
COPY --from=build /home/node/dist ./dist/
RUN npm ci --omit=dev

ARG PORT
ENV PORT=${PORT}
EXPOSE ${PORT}
CMD [ "node", "dist" ]
```

Key changes: a dedicated **`build`** stage compiles TS with dev dependencies; the **production**
stage copies only `dist/` + manifests and installs prod deps. The dev stage now also copies
`tsconfig.json`.

### 5. Update `compose.yml`

The app service mounts source for live reload. Add `tsconfig.json` to the mounts so the dev
toolchain sees it; keep the `src` mount.

```yaml
volumes:
  - ./src:/home/node/src
  - ./tsconfig.json:/home/node/tsconfig.json
  - ./package.json:/home/node/package.json
```

No other compose services (mongodb, redis, floci) change.

### 6. Ignore build output

- `.gitignore`: add `dist/` and `*.tsbuildinfo`.
- `.dockerignore`: ensure `dist/` and `node_modules/` are ignored so the build stage compiles cleanly.

## Acceptance criteria

Run these and confirm the expected outcomes:

- [ ] `npm install` completes; `typescript`, `@types/node`, `tsx`, and `zod` appear in
      `package.json` with pinned versions.
- [ ] `tsconfig.json` exists at the repo root with `strict: true` and the `#/*` path mapping.
- [ ] `npx tsc --noEmit` runs (it may report **0 files** since no `.ts` exists yet — that's fine;
      it must not error on config).
- [ ] `docker compose build` **succeeds** for the app service (the multi-stage build including the
      new `build` stage completes without error).
- [ ] `git status` shows `dist/` is ignored (not tracked).
- [ ] `.dockerignore` excludes `dist/` and `node_modules/`.
- [ ] You recorded, in the commit message, whether the dev container boots via `tsx` now or stays
      on `node --watch` until step 04.

## Notes / gotchas

- The **dev container may not fully boot the app yet** because `src/index.ts` doesn't exist — this
  is expected and resolved in steps 03–04. This step is about the **toolchain and images**, not a
  running app.
- Match `@types/node` to the Node 24 major line to avoid lib mismatches.
- Do not add a linter/formatter change here — that's step 02.

➡️ Next: [`02-tooling-lint-format-test.md`](./02-tooling-lint-format-test.md)
