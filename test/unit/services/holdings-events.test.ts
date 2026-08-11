import { PublishCommand, type SNSClient } from '@aws-sdk/client-sns'
import { publishHoldingCreated } from '#/services/holdings-events.js'
import type { Holding } from '#/services/holdings.js'

describe('#publishHoldingCreated', () => {
  const holding: Holding = { cph: '12/345/6789', name: 'Green Acres Farm' }
  const topicArn = 'arn:aws:sns:eu-west-2:000000000000:holding-events'

  test('Should propagate an error thrown by the SNS publish call', async () => {
    const publishError = new Error('topic unreachable')
    const send = vi.fn().mockRejectedValue(publishError)
    const snsClient = { send } as unknown as SNSClient

    await expect(
      publishHoldingCreated(snsClient, topicArn, holding)
    ).rejects.toBe(publishError)
  })

  test('Should publish a holding-created message to the configured topic', async () => {
    const send = vi.fn().mockResolvedValue({})
    const snsClient = { send } as unknown as SNSClient

    await publishHoldingCreated(snsClient, topicArn, holding)

    expect(send).toHaveBeenCalledTimes(1)
    const command = send.mock.calls[0]?.[0] as PublishCommand
    expect(command).toBeInstanceOf(PublishCommand)
    expect(command.input).toEqual({
      TopicArn: topicArn,
      Message: JSON.stringify({ type: 'holding-created', holding })
    })
  })
})
