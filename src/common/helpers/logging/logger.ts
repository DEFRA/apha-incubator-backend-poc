import { pino, type Logger } from 'pino'

import { loggerOptions } from '#/plugins/logger-options.js'

const logger = pino(loggerOptions)

/**
 * Returns the shared, ECS-formatted Pino logger instance.
 *
 * @returns The application's singleton logger.
 */
export function createLogger(): Logger {
  return logger
}
