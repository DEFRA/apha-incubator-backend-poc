# Step 07 — Tests Migration to TypeScript

> **Prerequisite:** [`06-services-and-domain-models.md`](./06-services-and-domain-models.md)
> complete (all `src/` **source** is TypeScript; only tests remain in JS).

## Goal

Convert every test to TypeScript and align the layout to the project's convention: **tests live
in a separate `test/` folder** (per `AGENTS.md`), not colocated under `src/`. Keep full coverage
green.

## Prerequisites / starting state

Current tests are colocated `*.test.js` files under `src/`:

- `src/plugins/mongodb.test.js`
- `src/common/helpers/convict/validate-mongo-uri.test.js`
- `src/common/helpers/fail-action.test.js`
- `src/common/helpers/start-server.test.js`
- `src/common/helpers/mongo-lock.test.js`

Vitest setup files live in `.vite/`: `mongo-memory-server.js`, `setup-files.js`. Vitest globals
are enabled; `#/` alias was wired for tests in step 02.

## Context — files you will touch

- Each `src/**/*.test.js` → `test/**/*.test.ts`
- `vitest.config.js` — coverage `include`, and confirm test discovery covers `test/`.
- `.vite/*.js` setup files — convert to `.ts` if desired (optional; JS setup still runs).
- `package.json` / `tsconfig.json` — ensure tests type-check appropriately.

## Instructions

### 1. Decide test typing scope

Vitest runs `.ts` tests natively via esbuild (type-stripping), so tests **run** without being
part of the `tsc` build. Choose one:

- **A (recommended):** Tests are excluded from the production `tsconfig.json` build (already the
  case — `exclude: ["test", ...]`), but type-checked via a separate `tsconfig.test.json` that
  `include`s both `src` and `test`. Add a `typecheck:test` script. This gives you type safety in
  tests without polluting `dist/`.
- **B (lighter):** Tests run under Vitest but are not type-checked by `tsc`. Simpler, but you lose
  compile-time checking of test code.

State your choice in the commit. If A, add:

```jsonc
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": true, "types": ["vitest/globals", "node"] },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

```jsonc
// package.json scripts
{
  "typecheck": "tsc --noEmit",
  "typecheck:test": "tsc --noEmit -p tsconfig.test.json"
}
```

### 2. Move and convert each test

For each colocated test, move it under `test/` mirroring the `src` structure, rename to `.ts`, and
update it:

| From | To |
| --- | --- |
| `src/plugins/mongodb.test.js` | `test/plugins/mongodb.test.ts` |
| `src/common/helpers/convict/validate-mongo-uri.test.js` | `test/common/helpers/convict/validate-mongo-uri.test.ts` |
| `src/common/helpers/fail-action.test.js` | `test/common/helpers/fail-action.test.ts` |
| `src/common/helpers/start-server.test.js` | `test/common/helpers/start-server.test.ts` |
| `src/common/helpers/mongo-lock.test.js` | `test/common/helpers/mongo-lock.test.ts` |

In each test:
- Import the unit under test via the `#/` alias with a `.js` specifier
  (e.g. `import { failAction } from '#/common/helpers/fail-action.js'`).
- Add types where they clarify intent (typed fixtures, typed mocks). Do not use `any`; use
  `unknown` + narrowing, or precise types from the source modules.
- Type Vitest mocks with `vi.fn<...>()` / `MockedFunction` where helpful.
- Keep assertions and behaviour identical — this is a move + type conversion, not a rewrite.

### 3. Update `vitest.config.js`

- Coverage `include` → `src/**/*.ts` (exclude `.d.ts`, `dist`, `coverage`, and setup files as
  appropriate).
- Vitest discovers `*.test.ts` anywhere by default; confirm the `test/` files are found. If you
  restricted `include`/`dir`, update it to cover `test/`.
- The `#` alias (added in step 02) must resolve for tests importing `#/...`.

```js
coverage: {
  provider: 'v8',
  reportsDirectory: './coverage',
  reporter: ['text', 'lcov'],
  include: ['src/**/*.ts'],
  exclude: [...configDefaults.exclude, 'coverage', 'dist', 'src/**/*.d.ts']
}
```

### 4. Setup files

`.vite/mongo-memory-server.js` and `.vite/setup-files.js` may remain `.js` (Vitest runs both). Only
convert them to `.ts` if you want type safety there; if you do, update `setupFiles` paths.

### 5. Remove empty `src` test remnants

After moving, ensure no `*.test.js` (or `.ts`) remain under `src/`, and delete now-empty folders if
any.

## Acceptance criteria

- [ ] No test files remain under `src/`; all live under `test/` as `*.test.ts`.
- [ ] `npm run test` passes with coverage, discovering the relocated tests.
- [ ] Coverage `include` targets `src/**/*.ts` and excludes `.d.ts`/`dist`/setup.
- [ ] If option A chosen: `npm run typecheck:test` passes with 0 errors.
- [ ] `npm run typecheck` (production build config) still passes and does **not** include tests.
- [ ] `npm run lint` and `npm run format:check` pass (lint globs include `test/**/*.ts`).
- [ ] No `any` in test code.

## Notes / gotchas

- Update the ESLint/Prettier globs (from step 02) if they were `src`-scoped so they also cover
  `test/**/*.ts`. The `**/*.{cjs,js,ts}` globs already do.
- Mongo-backed tests rely on `.vite/mongo-memory-server.js` and `vitest-mongodb` — keep those setup
  files wired via `setupFiles`.
- Import the **source** via `.js` specifiers even in tests (NodeNext/alias resolution). Don't import
  `.ts` paths directly.
- `fileParallelism: false` is set for a reason (shared Mongo memory server) — keep it.

➡️ Next: [`08-api-documentation.md`](./08-api-documentation.md)
