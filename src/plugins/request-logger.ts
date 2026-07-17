import hapiPino from 'hapi-pino'

import { loggerOptions } from './logger-options.js'

/** Hapi plugin that logs requests as structured ECS-compliant JSON via Pino. */
export const requestLogger = {
  plugin: hapiPino,
  options: loggerOptions
}
