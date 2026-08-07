import type { Db } from 'mongodb'
import { insertHolding } from '#/services/holdings-persist.js'
import { HoldingAlreadyExistsError } from '#/services/holdings-errors.js'
import type { Holding } from '#/services/holdings.js'

function mongoDuplicateKeyError(): Error & { code: number } {
  const error = new Error(
    'E11000 duplicate key error collection: holdings index: cph_1 dup key'
  ) as Error & { code: number }
  error.code = 11000
  return error
}

describe('#insertHolding', () => {
  const holding: Holding = { cph: '12/345/6789', name: 'Green Acres Farm' }

  test('Should throw HoldingAlreadyExistsError when the cph already exists', async () => {
    const insertOne = vi.fn().mockRejectedValue(mongoDuplicateKeyError())
    const db = {
      collection: vi.fn().mockReturnValue({ insertOne })
    } as unknown as Db

    await expect(insertHolding(db, holding)).rejects.toThrow(
      HoldingAlreadyExistsError
    )
  })

  test('Should propagate an unexpected error without wrapping it', async () => {
    const unexpectedError = new Error('connection reset')
    const insertOne = vi.fn().mockRejectedValue(unexpectedError)
    const db = {
      collection: vi.fn().mockReturnValue({ insertOne })
    } as unknown as Db

    await expect(insertHolding(db, holding)).rejects.toBe(unexpectedError)
  })

  test('Should insert the holding and return the persisted representation', async () => {
    const insertOne = vi.fn().mockResolvedValue({ acknowledged: true })
    const db = {
      collection: vi.fn().mockReturnValue({ insertOne })
    } as unknown as Db

    const result = await insertHolding(db, holding)

    expect(insertOne).toHaveBeenCalledWith(holding)
    expect(result).toEqual(holding)
  })
})
