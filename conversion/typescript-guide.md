# TypeScript for Node.js Developers — A Practical Guide

This guide teaches the core TypeScript features you need to work on this service, aimed at
developers who already know modern **Node.js + ESM JavaScript** but are new to TypeScript.

Every concept is paired with a **before (JS) → after (TS)** example drawn from this codebase
(`apha-incubator-backend-poc`), and stays within the **allowed TypeScript subset** defined in
[`../AGENTS.md`](../AGENTS.md). Features outside that subset (decorators, enums, mapped/
conditional types, declaration merging, `any`) are called out as **off-limits** so you don't
accidentally reach for them.

> Read this once end-to-end before starting the conversion prompts. Refer back to individual
> sections as they come up in each step.

---

## Table of contents

1. [Why TypeScript, and how it runs here](#1-why-typescript-and-how-it-runs-here)
2. [The compiler and `dist/` (the build step)](#2-the-compiler-and-dist-the-build-step)
3. [Structural typing and type inference](#3-structural-typing-and-type-inference)
4. [Annotating variables, parameters, and return types](#4-annotating-variables-parameters-and-return-types)
5. [`unknown`, `never`, `void` — and why never `any`](#5-unknown-never-void--and-why-never-any)
6. [Interfaces vs type aliases vs Zod schemas](#6-interfaces-vs-type-aliases-vs-zod-schemas)
7. [Union types, literal types, and optional properties](#7-union-types-literal-types-and-optional-properties)
8. [Narrowing and type guards](#8-narrowing-and-type-guards)
9. [Utility types: `Partial`, `Pick`, `Omit`](#9-utility-types-partial-pick-omit)
10. [Generics — only as far as the libraries require](#10-generics--only-as-far-as-the-libraries-require)
11. [Modules, ESM, `NodeNext`, and the `#/` alias](#11-modules-esm-nodenext-and-the--alias)
12. [JSDoc in TypeScript](#12-jsdoc-in-typescript)
13. [Zod vs Joi: two validation boundaries](#13-zod-vs-joi-two-validation-boundaries)
14. [Typing third-party libraries (`@types`, declaration files)](#14-typing-third-party-libraries-types-declaration-files)
15. [`tsconfig.json` and the `strict` flags explained](#15-tsconfigjson-and-the-strict-flags-explained)
16. [Common compiler errors and how to fix them](#16-common-compiler-errors-and-how-to-fix-them)
17. [Features that are off-limits in this project](#17-features-that-are-off-limits-in-this-project)

---

## 1. Why TypeScript, and how it runs here

TypeScript is JavaScript **plus a static type system**. The types exist only at author/compile
time; they are erased before the code runs. You get:

- **Compile-time safety** — mistyped fields, wrong argument types, and forgotten `null` checks
  are caught before the code ever runs.
- **Better editor support** — autocomplete, inline docs, safe refactors.
- **Self-documenting contracts** — a function signature tells you exactly what goes in and out.

**Compile-time vs runtime is the single most important idea to internalise:**

> Types disappear at runtime. If a value comes from _outside_ your program (an HTTP request, a
> database, an environment variable, a queue message), TypeScript **cannot** guarantee its
> shape. That's why this project still validates at boundaries with **Joi** and **Zod** — see
> [§13](#13-zod-vs-joi-two-validation-boundaries).

In this service TypeScript is compiled with the `tsc` compiler to a `dist/` folder, and Node
runs the plain JavaScript output. This matches the container-first philosophy: the production
Docker image builds once and runs compiled JS.

---

## 2. The compiler and `dist/` (the build step)

`tsc` reads `tsconfig.json`, type-checks your `src/**/*.ts`, and emits `.js` (and optional
`.d.ts`/source maps) into `dist/`.

```jsonc
// tsconfig.json (illustrative — the real one is created in prompt 01)
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "sourceMap": true,
    "declaration": false,
    "paths": { "#/*": ["./src/*"] }
  },
  "include": ["src/**/*.ts"]
}
```

Two commands you'll use constantly:

- `npx tsc --noEmit` — **type-check only**, produce no files. This is your fast feedback loop
  and the gate every conversion step must pass.
- `npx tsc` (or `npm run build`) — type-check **and** emit `dist/`.

Runtime flow after conversion:

```
src/**/*.ts  ──tsc──▶  dist/**/*.js  ──node──▶  running service
```

> **Mental model:** treat `dist/` like a build artifact (similar to a bundled front-end). It is
> generated, git-ignored, and never edited by hand.

---

## 3. Structural typing and type inference

TypeScript uses **structural typing** ("duck typing"): two types are compatible if their
_shapes_ match, regardless of their names.

```ts
interface Named {
  name: string
}

function greet(x: Named): string {
  return `Hello, ${x.name}`
}

// Works — the object has the required shape, even without naming the type:
greet({ name: 'APHA' })
```

**Inference** means you rarely annotate everything — the compiler figures out types from usage.

```js
// Before (JS): no type information at all
const port = config.get('port')
```

```ts
// After (TS): `port` is inferred as `number` from convict's typing — no annotation needed
const port = config.get('port')
```

**Rule of thumb:** let TypeScript infer local variables; **do** annotate function parameters and
return types (see next section) because those are your public contracts.

---

## 4. Annotating variables, parameters, and return types

Annotations use `name: Type`. Per `AGENTS.md`, **always** type function parameters and return
values — they document the contract and stop inference from silently widening.

```js
// Before (JS): src/services/ExampleFind.js
export function findExampleData(db, id) {
  return db
    .collection('example-data')
    .findOne({ exampleId: id }, { projection: { _id: 0 } })
}
```

```ts
// After (TS): parameters and return type are explicit
import type { Db } from 'mongodb'
import type { ExampleData } from '#/services/example-data.js'

/**
 * Finds a single example record by its example id.
 *
 * @param db - The Mongo database handle from the request.
 * @param id - The example id to look up.
 * @returns The matching record, or `null` if none exists.
 */
export function findExampleData(
  db: Db,
  id: string
): Promise<ExampleData | null> {
  return db
    .collection<ExampleData>('example-data')
    .findOne({ exampleId: id }, { projection: { _id: 0 } })
}
```

Note `import type { ... }` — a **type-only import**. It imports something used purely as a type,
so the compiler erases it entirely (no runtime `import`). Prefer it for types/interfaces.

---

## 5. `unknown`, `never`, `void` — and why never `any`

| Type      | Meaning                                                           | Use it for                                                             |
| --------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `unknown` | "some value, type not yet known" — you **must narrow** before use | Values from outside: `catch (e)`, parsed JSON, untyped library returns |
| `never`   | "this never happens / never returns"                              | Exhaustiveness checks; functions that always throw                     |
| `void`    | "returns nothing meaningful"                                      | Callback/handler return positions                                      |

**`any` is banned** in this project. `any` disables type checking for that value and everything
it touches — it silently spreads and defeats the purpose of TypeScript. Use `unknown` and narrow.

```js
// Before (JS): src/index.js
process.on('unhandledRejection', (error) => {
  logger.error(error)
})
```

```ts
// After (TS): `error` is `unknown`; narrow before using it
process.on('unhandledRejection', (error: unknown) => {
  const logger = createLogger()
  logger.info('Unhandled rejection')
  logger.error(error instanceof Error ? error : new Error(String(error)))
  process.exitCode = 1
})
```

```ts
// `never` for exhaustiveness — the compiler errors if a case is unhandled
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`)
}
```

---

## 6. Interfaces vs type aliases vs Zod schemas

Three ways to describe object shapes. `AGENTS.md` sets a clear **preference order**:

> **Zod schema → `type` alias → `interface`.**

### Zod schema (preferred for runtime-validated data)

Define the schema once, derive the type from it. One source of truth for _validation_ **and**
the static _type_. Use this for anything crossing a non-HTTP boundary (DB docs, queue messages,
external API responses, config).

```ts
import { z } from 'zod'

export const exampleDataSchema = z.object({
  exampleId: z.string(),
  name: z.string()
})

export type ExampleData = z.infer<typeof exampleDataSchema>
// ExampleData is { exampleId: string; name: string }
```

### `type` alias (preferred for pure types with no runtime validation)

```ts
type ExampleId = string
type MongoConfig = { mongoUrl: string; databaseName: string }
type Result = 'ok' | 'error' // unions must use `type`, not `interface`
```

### `interface` (last choice; fine for object contracts you extend)

```ts
interface Holding {
  cph: string
  name: string
  archived?: boolean
}
```

**Practical differences:** `interface` can only describe object shapes and can be re-opened
("declaration merging" — which is **off-limits** here, see [§17](#17-features-that-are-off-limits-in-this-project)).
`type` can alias unions, primitives, and objects, and cannot be merged — which is exactly why
this project prefers it. When in doubt and the data is validated at runtime, use **Zod**.

---

## 7. Union types, literal types, and optional properties

**Union** (`A | B`) — a value is one of several types. **Literal** types narrow to exact values.

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error' // union of string literals
type Nullable<T> = T | null

let level: LogLevel = 'info'
level = 'verbose' // ❌ compile error — not one of the allowed literals
```

**Optional properties** use `?`, meaning the key may be absent (its type becomes `T | undefined`).

```ts
interface Holding {
  cph: string
  name: string
  archived?: boolean // may be omitted entirely
}
```

Optional (`archived?: boolean`) is different from "required but nullable" (`archived: boolean | null`):
the first lets you omit the key; the second requires the key but allows `null`.

---

## 8. Narrowing and type guards

When you have a union (or `unknown`), you **narrow** it to a specific type before using it.
TypeScript understands ordinary JavaScript checks:

```ts
function describe(value: string | number): string {
  if (typeof value === 'number') {
    return value.toFixed(2) // here `value` is `number`
  }
  return value.toUpperCase() // here `value` is `string`
}
```

Common narrowing tools: `typeof`, `instanceof`, `in`, truthiness checks, and equality against
literals. For the frequent "did this find anything?" case:

```ts
const entity = await findExampleData(db, id) // ExampleData | null
if (!entity) {
  return Boom.notFound() // narrowed away the null branch
}
return h.response(entity) // `entity` is ExampleData here
```

**Custom type guard** — a function returning `x is T` teaches the compiler how to narrow:

```ts
function isError(x: unknown): x is Error {
  return x instanceof Error
}
```

---

## 9. Utility types: `Partial`, `Pick`, `Omit`

Built-in helpers that transform existing types — allowed and encouraged "when appropriate".

```ts
interface Holding {
  cph: string
  name: string
  archived?: boolean
}

type HoldingPatch = Partial<Holding> // every property optional (for updates)
type HoldingSummary = Pick<Holding, 'cph' | 'name'> // only these keys
type HoldingWithoutCph = Omit<Holding, 'cph'> // all keys except this one
```

Use them to avoid duplicating shapes — e.g. a "create" input that omits a server-generated id,
or a "patch" input where all fields are optional.

> These three are on the allowed list. Their more advanced cousins built from **mapped/
> conditional types** are **off-limits** — see [§17](#17-features-that-are-off-limits-in-this-project).

---

## 10. Generics — only as far as the libraries require

Generics are type parameters — types that take types, like functions take values. In this
project they are allowed **only where a library pattern requires them** (per `AGENTS.md`), such
as `z.infer<typeof schema>` or typing a Mongo collection. Don't invent your own generic
abstractions.

```ts
// Library-driven generics you WILL use:
type ExampleData = z.infer<typeof exampleDataSchema> // Zod
const coll = db.collection<ExampleData>('example-data') // mongodb driver
const server = Hapi.server({
  /* ... */
}) // hapi's own generic typings
```

```ts
// ❌ Don't do this — a bespoke generic abstraction is beyond the allowed subset:
function wrap<T, U>(x: T, f: (t: T) => U): U {
  return f(x)
}
```

If you feel you need a custom generic, that's a signal to stop and reach for a Zod schema or a
concrete type instead.

---

## 11. Modules, ESM, `NodeNext`, and the `#/` alias

This service is **ESM** (`"type": "module"`) and uses `moduleResolution: NodeNext`. Two things
surprise JS developers:

**1. Import specifiers keep the `.js` extension — even from `.ts` files.** Under `NodeNext`, you
import the _output_ path. So a `.ts` file imports another module as `./thing.js`, and `tsc`
resolves it to `thing.ts` at compile time.

```ts
// In server.ts — note the `.js` even though the file on disk is config.ts
import { config } from '#/config.js'
import { router } from '#/plugins/router.js'
```

**2. The `#/` alias** maps to `src/`. It's declared in `package.json` `imports` (`"#/*"`) and
mirrored in `tsconfig.json` `paths` so both Node and the type-checker resolve it.

```ts
import { failAction } from '#/common/helpers/fail-action.js' // → src/common/helpers/fail-action.ts
```

**Type-only imports** (`import type`) are erased at compile time — prefer them for importing
interfaces/types so no runtime dependency is created:

```ts
import type { Server, Request, ResponseToolkit } from '@hapi/hapi'
```

---

## 12. JSDoc in TypeScript

`AGENTS.md` requires JSDoc on **all exported functions, interfaces, and type aliases**. In TS you
do **not** repeat types in JSDoc (`@param {string}`) — the type annotations already carry them.
JSDoc adds the human explanation.

```ts
/**
 * Retrieves all example records.
 *
 * @param db - The Mongo database handle from the request.
 * @returns All example records with the internal `_id` projected out.
 */
export function findAllExampleData(db: Db): Promise<ExampleData[]> {
  return db
    .collection<ExampleData>('example-data')
    .find({}, { projection: { _id: 0 } })
    .toArray()
}
```

Document **why/what**, not the mechanics the types already express. Use `@throws` for error
conditions and `@returns` for the meaningful result.

---

## 13. Zod vs Joi: two validation boundaries

This is a project rule, not a preference — **do not mix them**:

| Boundary                                                                        | Library | Where            |
| ------------------------------------------------------------------------------- | ------- | ---------------- |
| **HTTP route validation** (`validate.payload/params/query/headers`)             | **Joi** | Hapi routes only |
| **Domain / internal runtime types** (DB docs, config, queue msgs, external API) | **Zod** | Everywhere else  |

Joi is Hapi's native validator — it plugs into the request lifecycle (auto 400s, `failAction`).
Zod gives ergonomic schemas plus `z.infer` types for your domain models.

```ts
// HTTP boundary — Joi (in a route's `options.validate`)
import Joi from 'joi'

const exampleParamsSchema = Joi.object({
  exampleId: Joi.string().required()
})
```

```ts
// Domain boundary — Zod (schema + inferred type in one)
import { z } from 'zod'

export const exampleDataSchema = z.object({
  exampleId: z.string(),
  name: z.string()
})
export type ExampleData = z.infer<typeof exampleDataSchema>
```

**Why both?** Types are erased at runtime ([§1](#1-why-typescript-and-how-it-runs-here)). A
declared TypeScript type gives you _zero_ runtime protection against a malformed request body or
an unexpected database document. Joi/Zod re-establish that guarantee at the edges.

---

## 14. Typing third-party libraries (`@types`, declaration files)

TypeScript needs type information for the packages you import. Three situations:

1. **Package ships its own types** (e.g. `zod`, `mongodb`, `@hapi/hapi`) — nothing to do, they
   just work.
2. **Types live in a separate `@types/*` package** (DefinitelyTyped) — install as a dev
   dependency, e.g. `@types/node`. The conversion prompts install what's needed.
3. **No types exist anywhere** — you may need a small ambient declaration. Keep these rare and
   minimal (a `*.d.ts` with `declare module 'pkg'`). Never paper over missing types with `any`.

You'll also **augment** Hapi's `Request`/`Server` types so decorations added by plugins (like
`request.db` and `server.locker` from `mongodb.js`) are known to the compiler. That's done with
module augmentation of `@hapi/hapi` in a `.d.ts` — introduced in the server/plugins step.

---

## 15. `tsconfig.json` and the `strict` flags explained

`strict: true` turns on a family of checks. `AGENTS.md` **requires** it. The most impactful:

| Flag (enabled by `strict`)     | What it catches                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `strictNullChecks`             | `null`/`undefined` must be handled explicitly — no accidental "cannot read property of undefined".   |
| `noImplicitAny`                | Every value must have a known type; forgotten annotations that would default to `any` become errors. |
| `strictFunctionTypes`          | Callback parameter types are checked more soundly.                                                   |
| `strictPropertyInitialization` | Class fields must be initialised (rarely relevant here — few classes).                               |
| `alwaysStrict`                 | Emits `"use strict"` and parses in strict mode.                                                      |

Other useful options the conversion may set: `noUncheckedIndexedAccess` (array/object index
access yields `T | undefined`), `noImplicitReturns`, and `verbatimModuleSyntax` (enforces
`import type` for type-only imports). `strictNullChecks` is the one you'll _feel_ most — it's
also where most of TypeScript's value comes from.

---

## 16. Common compiler errors and how to fix them

| Error                                                                                     | Typical cause                                            | Fix                                                                     |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `Object is possibly 'null'` / `'undefined'`                                               | Using a value that might be missing (`strictNullChecks`) | Narrow first: `if (!x) return ...` or optional chaining `x?.y`.         |
| `Parameter 'x' implicitly has an 'any' type`                                              | Missing parameter annotation (`noImplicitAny`)           | Add an explicit type to the parameter.                                  |
| `Cannot find module './foo' or its type declarations`                                     | Wrong specifier or missing `@types`                      | Use the `.js` extension under NodeNext; install the `@types/*` package. |
| `Property 'db' does not exist on type 'Request'`                                          | Plugin decoration not declared to TS                     | Augment `@hapi/hapi`'s `Request`/`Server` interface (server step).      |
| `Type 'string \| undefined' is not assignable to type 'string'`                           | A possibly-absent value used where required              | Guard it, provide a default, or make the target optional.               |
| `Type 'unknown' is not assignable...`                                                     | Using a `catch` error / parsed value directly            | Narrow with `instanceof`/`typeof`, or validate with Zod.                |
| `An import path can only end with a '.ts' extension when 'allowImportingTsExtensions'...` | Imported `./x.ts` instead of `./x.js`                    | Import the `.js` output path, not the `.ts` source.                     |

General approach: run `npx tsc --noEmit`, read the **first** error (later ones are often
cascades), fix it, re-run. Fixing the top error frequently clears several below it.

---

## 17. Features that are off-limits in this project

Per the `AGENTS.md` allowed-features table, **do not** use these — if you think you need one,
ask the user first:

- **`any`** — use `unknown` and narrow.
- **Decorators** — avoid unless a framework mandates them (Hapi does not).
- **Enums** — prefer string-literal unions (`type X = 'a' | 'b'`) or Zod `z.enum([...])`.
- **Mapped types** (`{ [K in keyof T]: ... }`) and **conditional types** (`T extends U ? X : Y`)
  — beyond the sanctioned utility types (`Partial`/`Pick`/`Omit`), don't build your own.
- **Declaration merging** — don't re-open interfaces to add members (module augmentation of a
  library's types in a `.d.ts` for plugin decorations is the one sanctioned exception, used
  deliberately for Hapi).
- **Bespoke generics** — only use generics the libraries hand you (`z.infer`, collection typing).

Keeping to this subset means the code stays readable to JS developers, compiles cleanly, and
avoids "clever" types that are hard to maintain.

---

## Where to go next

Head to [`prompts/00-conversion-overview.md`](./prompts/00-conversion-overview.md) for the
migration ground rules, then work through the numbered prompts in order.
