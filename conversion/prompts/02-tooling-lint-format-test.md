# Step 02 — Tooling: ESLint, Prettier, Vitest & Type-checking

> **Prerequisite:** [`01-docker-and-dependencies.md`](./01-docker-and-dependencies.md) complete
> (TS deps installed, `tsconfig.json` present, Docker builds).

## Goal

Teach the project's quality gates to understand TypeScript, so that from now on every converted
`.ts` file is linted, formatted, type-checked, and testable. No `src` application code changes in
this step — only tooling config and scripts.

## Prerequisites / starting state

- ESLint via **`neostandard`** (`eslint.config.js`), configured for `.js`/`.cjs`, `noJsx`,
  `noStyle`, ignoring gitignored paths.
- Prettier configured (`.prettierrc.js`), formatting `**/*.{cjs,js,json,md}`.
- Vitest (`vitest.config.js`) with `include: ['src/**/*.js']` for coverage; setup files under
  `.vite/`; tests currently colocated as `src/**/*.test.js`.
- `package.json` lint script targets `**/*.{cjs,js}`.

## Context — files you will touch

- `eslint.config.js` — add TypeScript support.
- `package.json` — lint/format/test/typecheck scripts and globs.
- `.prettierignore` / `prettier` globs — include `.ts`.
- `vitest.config.js` — coverage `include` for `.ts`; ensure TS tests run.
- Pre-commit hook (`.husky/`, `git:pre-commit-hook` script) — add typecheck.

## Instructions

### 1. Add TypeScript ESLint support

`neostandard` supports TypeScript. Enable it and add the type-aware parser/plugin. Install any
missing pieces:

```bash
npm install -D typescript-eslint
```

Update `eslint.config.js` to lint `.ts` as well as `.js`, composing `neostandard` with
`typescript-eslint`'s recommended config:

```js
import neostandard from 'neostandard'
import tseslint from 'typescript-eslint'

export default [
  ...neostandard({
    env: ['node', 'vitest'],
    ignores: [...neostandard.resolveIgnoresFromGitignore(), 'dist'],
    ts: true,
    noJsx: true,
    noStyle: true
  }),
  ...tseslint.configs.recommended,
  {
    rules: {
      // Enforce the AGENTS.md subset:
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  }
]
```

> If `neostandard` already bundles `typescript-eslint` internally, prefer its `ts: true` option
> and only add explicit rules for `no-explicit-any` and `consistent-type-imports`. Verify which
> mechanism your installed `neostandard` version uses and keep the config minimal.

### 2. Update lint scripts to cover `.ts`

In `package.json`:

```jsonc
{
  "scripts": {
    "lint": "eslint --cache --cache-strategy content \"**/*.{cjs,js,ts}\"",
    "lint:fix": "npm run lint -- --fix"
  }
}
```

### 3. Update Prettier globs to include `.ts`

```jsonc
{
  "scripts": {
    "format": "prettier --write \"**/*.{cjs,js,ts,json,md}\"",
    "format:check": "prettier --check \"**/*.{cjs,js,ts,json,md}\""
  }
}
```

Ensure `.prettierignore` excludes `dist/` and `coverage/`.

### 4. Wire Vitest for TypeScript

Vitest runs `.ts` natively (esbuild) — no extra transform needed. Update coverage/includes and
resolve the `#/` alias for tests. In `vitest.config.js`:

```js
import { defineConfig, configDefaults } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [...configDefaults.exclude, 'coverage', 'dist']
    },
    setupFiles: ['.vite/mongo-memory-server.js', '.vite/setup-files.js']
  }
})
```

> Keep coverage `include` as `src/**/*.js` **temporarily** if you want coverage on files not yet
> converted; switch fully to `src/**/*.ts` once step 06 finishes. State your choice in the commit.
> The `#` alias here lets test files import via `#/...` the same way source does.

### 5. Add type-checking to the pre-commit gate

Update the `git:pre-commit-hook` script so a type error blocks a commit:

```jsonc
{
  "scripts": {
    "git:pre-commit-hook": "npm run security-audit && npm run typecheck && npm run format:check && npm run lint && npm test"
  }
}
```

Confirm `.husky/pre-commit` invokes `npm run git:pre-commit-hook` (leave the hook file as-is if it
already does).

### 6. Editor settings (optional but recommended)

If `.vscode/settings.json` exists, ensure it uses the workspace TypeScript SDK and formats on
save with Prettier. Do not add new tooling the team hasn't agreed to.

## Acceptance criteria

- [ ] `npm run lint` runs against `**/*.{cjs,js,ts}` and passes on the current (still-JS) tree.
- [ ] `npm run format:check` includes `.ts` in its glob and passes.
- [ ] `npm run typecheck` (`tsc --noEmit`) runs cleanly (0 `.ts` files yet ⇒ 0 errors).
- [ ] `npm run test` still passes (existing JS tests unaffected).
- [ ] `eslint.config.js` enforces `no-explicit-any` and `consistent-type-imports`.
- [ ] `git:pre-commit-hook` now includes `typecheck`.
- [ ] `dist/` and `coverage/` are excluded from lint, format, and coverage.

## Notes / gotchas

- Type-aware lint rules can be slow; `skipLibCheck: true` (set in step 01) keeps `tsc` fast.
- Don't convert any `src` files here — a converted file with lint errors would muddy this step's
  signal. This step must pass on the **existing** JS tree.
- If `typescript-eslint` recommended rules are too strict for the transitional period, relax
  specific rules with a comment explaining why, but **never** disable `no-explicit-any`.

➡️ Next: [`03-config-and-types-foundation.md`](./03-config-and-types-foundation.md)
