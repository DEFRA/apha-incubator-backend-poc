import { buildHoldingPublishErrorLog } from '#/common/helpers/logging/build-holding-publish-error-log.js'
import type { Holding } from '#/services/holdings.js'

describe('#buildHoldingPublishErrorLog', () => {
  const holding: Holding = { cph: '12/345/6789', name: 'Green Acres Farm' }

  test('Should return an ECS-compliant event/error log for a publish failure', () => {
    const err = new Error('topic unreachable')

    const log = buildHoldingPublishErrorLog(holding, err)

    expect(log).toEqual({
      event: {
        type: 'holding_created_publish',
        action: 'publish',
        outcome: 'failure',
        reference: '12/345/6789'
      },
      error: {
        message: 'topic unreachable',
        stack_trace: err.stack,
        type: 'Error'
      }
    })
  })

  test('Should not include any flat top-level keys outside event/error', () => {
    const log = buildHoldingPublishErrorLog(holding, new Error('boom'))

    expect(Object.keys(log).sort()).toEqual(['error', 'event'])
  })
})
