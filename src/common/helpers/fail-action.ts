import type { Request, ResponseToolkit } from '@hapi/hapi'

import { createLogger } from './logging/logger.js'

const logger = createLogger()

/**
 * Hapi `failAction` handler for route validation failures — logs the error and
 * rethrows it so the global validation `failAction` produces a `400` response.
 *
 * @throws {Error} Always rethrows the provided validation error.
 */
export function failAction(
  _request: Request,
  _h: ResponseToolkit,
  error?: Error
): never {
  logger.warn(error, error?.message)
  throw error
}
