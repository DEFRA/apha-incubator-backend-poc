import { ecsFormat } from '@elastic/ecs-pino-format'
import { config } from '#/config.js'
import { getTraceId } from '@defra/hapi-tracing'

const logConfig = config.get('log')
const serviceName = config.get('serviceName')
const serviceVersion = config.get('serviceVersion')

const formatters = {
  ecs: {
    ...ecsFormat({
      serviceVersion: serviceVersion ?? undefined,
      serviceName
    })
  },
  'pino-pretty': { transport: { target: 'pino-pretty' } }
}

/** ECS-compliant Pino logger options for the `request-logger` (`hapi-pino`) plugin. */
export const loggerOptions = {
  enabled: logConfig.isEnabled,
  ignorePaths: ['/health'],
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  level: logConfig.level,
  ...formatters[logConfig.format],
  nesting: true,
  mixin(): { trace?: { id: string } } {
    const mixinValues: { trace?: { id: string } } = {}
    const traceId = getTraceId()
    if (traceId) {
      mixinValues.trace = { id: traceId }
    }
    return mixinValues
  }
}
