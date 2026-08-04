# apha-incubator-backend-poc

Core delivery platform Node.js Backend Template.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Local development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
  - [Testing](#testing)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Update dependencies](#update-dependencies)
  - [Formatting](#formatting)
    - [Windows prettier issue](#windows-prettier-issue)
- [API endpoints](#api-endpoints)
- [Development helpers](#development-helpers)
  - [MongoDB Locks](#mongodb-locks)
  - [Proxy](#proxy)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
  - [Dependabot](#dependabot)
  - [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v24` and [npm](https://nodejs.org/) `>= v11`. You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd apha-incubator-backend-poc
nvm use
```

## Local development

### Setup

Install application dependencies:

```bash
npm install
```

### Git hooks

Install git hooks (optional)

```bash
npm run git:hooks
```

### Development

This service is written in TypeScript. Source lives under `src/**/*.ts` and is run directly (no
build step) via [`tsx`](https://github.com/privatenumber/tsx) in watch mode:

```bash
npm run dev
```

To type-check without emitting output:

```bash
npm run typecheck        # checks src/**/*.ts
npm run typecheck:test   # checks test/**/*.ts
```

### Testing

To test the application run:

```bash
npm run test
```

Tests live under `test/**/*.ts` (mirroring the `src/` structure) and are written in TypeScript,
run with [Vitest](https://vitest.dev/).

### Production

Production runs the compiled JavaScript output, not the TypeScript source. Build first:

```bash
npm run build             # tsc compiles src/**/*.ts -> dist/**/*.js
```

Then to mimic the application running in `production` mode locally run:

```bash
npm start                 # runs node ./dist/index.js
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json).
To view them in your command line run:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## API endpoints

| Endpoint              | Description                                         |
| :-------------------- | :-------------------------------------------------- |
| `GET: /health`        | Health                                              |
| `GET: /example`       | Example API (remove as needed)                      |
| `GET: /example/<id>`  | Example API (remove as needed)                      |
| `GET: /documentation` | Interactive Swagger UI (generated from Joi schemas) |
| `GET: /swagger.json`  | Raw OpenAPI spec                                    |

Route validation is defined with [Joi](https://joi.dev/) at the HTTP boundary, and
[hapi-swagger](https://github.com/hapipal/hapi-swagger) generates the API documentation directly
from those Joi schemas (routes tagged `api` appear in the docs; `/health` is intentionally
excluded).

## Development helpers

### MongoDB Locks

If you require a write lock for Mongo you can acquire it via `server.locker` or `request.locker`:

```typescript
async function doStuff(server) {
  const lock = await server.locker.lock('unique-resource-name')

  if (!lock) {
    // Lock unavailable
    return
  }

  try {
    // do stuff
  } finally {
    await lock.free()
  }
}
```

Keep it small and atomic.

You may use **using** for the lock resource management.
Note test coverage reports do not like that syntax.

```typescript
async function doStuff(server) {
  await using lock = await server.locker.lock('unique-resource-name')

  if (!lock) {
    // Lock unavailable
    return
  }

  // do stuff

  // lock automatically released
}
```

Helper methods are also available in `/src/common/helpers/mongo-lock.ts`.

### Proxy

We are using forward-proxy which is set up by default. To make use of this: `import { fetch } from 'undici'` then
because of the `setGlobalDispatcher(new ProxyAgent(proxyUrl))` calls will use the ProxyAgent Dispatcher

If you are not using Wreck, Axios or Undici or a similar http that uses `Request`. Then you may have to provide the
proxy dispatcher:

To add the dispatcher to your own client:

```typescript
import { ProxyAgent } from 'undici'

return await fetch(url, {
  dispatcher: new ProxyAgent({
    uri: proxyUrl,
    keepAliveTimeout: 10,
    keepAliveMaxTimeout: 10
  })
})
```

## Docker

This is a multi-stage `Dockerfile` with `development`, `build` and `production` stages. The
`build` stage compiles TypeScript (`src/**/*.ts`) with `tsc` into `dist/**/*.js`; the
`production` stage only contains the compiled `dist/` output plus production dependencies (no
TypeScript, no `src/`).

Build:

```bash
docker build --no-cache --tag apha-incubator-backend-poc .
```

Run:

```bash
docker run -e PORT=3001 -p 3001:3001 apha-incubator-backend-poc
```

### Development image

The `development` target installs all dependencies and runs the TypeScript source directly via
`tsx watch` (see [`npm run dev`](#development)) - there is no compile step, so changes to `.ts`
files are picked up immediately.

### Production image

The `production` target runs the compiled output with `node dist` - no TypeScript tooling is
present in this image. Build and run it directly with:

```bash
docker build --target production --tag apha-incubator-backend-poc:prod .
docker run -e PORT=3001 -p 3001:3001 apha-incubator-backend-poc:prod
```

### Docker Compose

A local environment with:

- Floci for AWS services (S3, SQS, SNS etc)
- Redis
- MongoDB
- This service.
- A commented out frontend example.

```bash
docker compose up --build -d
```

Mock AWS resources can be created when Floci starts up by editing the scripts in `./compose/floci/start.d/`.
MongoDB records can also be created when Mongo starts by editing the scripts in `./compose/mongo/`.

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
