import type { Holding } from '#/services/holdings.js'

/**
 * Builds the ECS-compliant structured log context for a failed holding-created
 * event publish to SNS. Used so the failure is observable even though it does
 * not fail the `POST /holdings` response.
 *
 * @param holding - The holding that was persisted but whose event failed to publish.
 * @param err - The error thrown by the SNS publish call.
 */
export function buildHoldingPublishErrorLog(
  holding: Holding,
  err: Error
): Record<string, unknown> {
  return {
    event: {
      type: 'holding_created_publish',
      action: 'publish',
      outcome: 'failure',
      reference: holding.cph
    },
    error: {
      message: err.message,
      stack_trace: err.stack,
      type: err.constructor.name
    }
  }
}
