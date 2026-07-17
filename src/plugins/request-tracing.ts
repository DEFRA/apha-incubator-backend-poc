import { tracing } from '@defra/hapi-tracing'
import { config } from '#/config.js'

/** Hapi plugin that propagates a request tracing header through the request lifecycle. */
export const requestTracing = {
  plugin: tracing.plugin,
  options: {
    tracingHeader: config.get('tracing.header')
  }
}
