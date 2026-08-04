import hapiPulse from 'hapi-pulse'
import { createLogger } from '#/common/helpers/logging/logger.js'

const tenSeconds = 10 * 1000

/** Hapi plugin that periodically logs process/event-loop health metrics. */
export const pulse = {
  plugin: hapiPulse,
  options: {
    logger: createLogger(),
    timeout: tenSeconds
  }
}
