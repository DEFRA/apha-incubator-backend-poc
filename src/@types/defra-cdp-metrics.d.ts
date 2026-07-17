// Minimal ambient types for `@defra/cdp-metrics`, which ships no bundled
// types and has no published `@types` package.
declare module '@defra/cdp-metrics' {
  import type { Plugin } from '@hapi/hapi'

  /** Hapi plugin that decorates `server`/`request` with a metrics helper. */
  export const metrics: {
    plugin: Plugin<void>
  }
}
