// Minimal ambient types for `@defra/hapi-tracing`, which ships no bundled
// types and has no published `@types` package.
declare module '@defra/hapi-tracing' {
  import type { Plugin } from '@hapi/hapi'

  /** Options accepted by the tracing plugin's `register` function. */
  export interface TracingPluginOptions {
    tracingHeader: string
  }

  /** Hapi plugin that propagates and logs the CDP request tracing header. */
  export const tracing: {
    plugin: Plugin<TracingPluginOptions>
  }

  /** Returns the current request's trace id, if one has been set. */
  export function getTraceId(): string | undefined
}
