// Minimal ambient types for `@defra/hapi-secure-context`, which ships no
// bundled types and has no published `@types` package.
declare module '@defra/hapi-secure-context' {
  import type { Plugin } from '@hapi/hapi'

  /** Hapi plugin that loads CA certificates from environment config. */
  export const secureContext: {
    plugin: Plugin<void>
  }
}
