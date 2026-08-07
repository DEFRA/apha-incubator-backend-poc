import type { Request, ResponseToolkit } from '@hapi/hapi'
import { holdings } from '#/routes/holdings.js'
import { insertHolding } from '#/services/holdings-persist.js'
import { publishHoldingCreated } from '#/services/holdings-events.js'
import { HoldingAlreadyExistsError } from '#/services/holdings-errors.js'
import type { Holding } from '#/services/holdings.js'

vi.mock('#/services/holdings-persist.js')
vi.mock('#/services/holdings-events.js')

const insertHoldingMock = vi.mocked(insertHolding)
const publishHoldingCreatedMock = vi.mocked(publishHoldingCreated)

describe('POST /holdings handler', () => {
  const holding: Holding = { cph: '12/345/6789', name: 'Green Acres Farm' }
  const handler = holdings[0]!.handler as (
    request: Request,
    h: ResponseToolkit
  ) => Promise<unknown>

  function buildRequest(): Request {
    return {
      payload: holding,
      db: {},
      snsClient: {},
      logger: { error: vi.fn() }
    } as unknown as Request
  }

  function buildH(): ResponseToolkit {
    const response = vi.fn().mockReturnValue({ code: vi.fn() })
    return { response } as unknown as ResponseToolkit
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Should still return 201 with the persisted holding when the SNS publish fails', async () => {
    insertHoldingMock.mockResolvedValue(holding)
    const publishError = new Error('topic unreachable')
    publishHoldingCreatedMock.mockRejectedValue(publishError)

    const request = buildRequest()
    const h = buildH()

    await handler(request, h)

    expect(h.response).toHaveBeenCalledWith(holding)
    expect(request.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({ outcome: 'failure' }),
        error: expect.objectContaining({ message: 'topic unreachable' })
      })
    )
  })

  test('Should return 201 and not log when the SNS publish succeeds', async () => {
    insertHoldingMock.mockResolvedValue(holding)
    publishHoldingCreatedMock.mockResolvedValue(undefined)

    const request = buildRequest()
    const h = buildH()

    await handler(request, h)

    expect(h.response).toHaveBeenCalledWith(holding)
    expect(request.logger.error).not.toHaveBeenCalled()
  })

  test('Should return 409 without attempting to publish when the holding already exists', async () => {
    insertHoldingMock.mockRejectedValue(
      new HoldingAlreadyExistsError(holding.cph)
    )

    const request = buildRequest()
    const h = buildH()

    await handler(request, h)

    expect(publishHoldingCreatedMock).not.toHaveBeenCalled()
  })
})
