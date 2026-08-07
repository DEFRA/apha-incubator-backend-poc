import { PublishCommand, type SNSClient } from '@aws-sdk/client-sns'
import type { Holding } from '#/services/holdings.js'

/**
 * Publishes a `holding-created` event to the given SNS topic.
 *
 * Called after a holding has been successfully persisted; any error thrown by
 * the SNS publish call propagates so the caller can decide how to handle it
 * (see `src/routes/holdings.ts`, which logs and swallows it rather than
 * failing the API response).
 *
 * @param snsClient - The SNS client used to publish the event.
 * @param topicArn - The ARN of the SNS topic to publish to.
 * @param holding - The persisted holding to publish as the event payload.
 */
export async function publishHoldingCreated(
  snsClient: SNSClient,
  topicArn: string,
  holding: Holding
): Promise<void> {
  await snsClient.send(
    new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify({ type: 'holding-created', holding })
    })
  )
}
