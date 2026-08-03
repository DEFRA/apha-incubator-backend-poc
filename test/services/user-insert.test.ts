import { ObjectId } from 'mongodb'
import type { Db, Collection } from 'mongodb'
import { insertUser } from '#/services/user-insert.js'

const userPayload = { name: 'Alice', age: 30 }

describe('#insertUser', () => {
  test('Should propagate errors from a failed Mongo insert', async () => {
    const insertOne = vi.fn().mockRejectedValue(new Error('Mongo unavailable'))
    const collection = { insertOne } as unknown as Collection
    const db = { collection: () => collection } as unknown as Db

    await expect(insertUser(db, userPayload)).rejects.toThrow(
      'Mongo unavailable'
    )
  })

  test('Should insert the user and return it with its generated id', async () => {
    const insertedId = new ObjectId()
    const insertOne = vi.fn().mockResolvedValue({ insertedId })
    const collectionSpy = vi.fn().mockReturnValue({ insertOne })
    const db = { collection: collectionSpy } as unknown as Db

    const result = await insertUser(db, userPayload)

    expect(collectionSpy).toHaveBeenCalledWith('users')
    expect(insertOne).toHaveBeenCalledWith(userPayload)
    expect(result).toEqual({
      id: insertedId.toString(),
      name: 'Alice',
      age: 30
    })
  })
})
