import type { Server } from '@hapi/hapi'
import { insertUser } from '#/services/user-insert.js'

vi.mock('#/services/user-insert.js', () => ({
  insertUser: vi.fn()
}))

const route = '/user'
const validPayload = { name: 'Alice', age: 30 }

describe('#POST /user', () => {
  let server: Server

  beforeAll(async () => {
    const { createServer } = await import('#/server.js')
    server = await createServer()
    await server.initialize()
  }, 30000)

  afterAll(async () => {
    await server.stop({ timeout: 1000 })
  })

  test('Should return 201 with the created user for a valid payload', async () => {
    vi.mocked(insertUser).mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      name: 'Alice',
      age: 30
    })

    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: route,
      payload: validPayload
    })

    expect(statusCode).toBe(201)
    expect(result).toEqual({
      id: '507f1f77bcf86cd799439011',
      name: 'Alice',
      age: 30
    })
  })

  test('Should return 400 for an invalid payload', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: route,
      payload: { age: 30 }
    })

    expect(statusCode).toBe(400)
  })

  test('Should return 500 when the insert fails', async () => {
    vi.mocked(insertUser).mockRejectedValue(new Error('Mongo unavailable'))

    const { statusCode } = await server.inject({
      method: 'POST',
      url: route,
      payload: validPayload
    })

    expect(statusCode).toBe(500)
  })
})
