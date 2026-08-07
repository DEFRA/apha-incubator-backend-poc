import type { Server } from '@hapi/hapi'
import { createServer } from '#/server.js'

describe('#POST /holdings', () => {
  let server: Server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  }, 30000)

  afterAll(async () => {
    await server.stop({ timeout: 1000 })
  })

  describe('Validation failures', () => {
    test('Should return 400 for an invalid payload', async () => {
      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/holdings',
        payload: { name: 'Green Acres Farm' }
      })

      expect(statusCode).toBe(400)
      expect(result).toMatchObject({
        statusCode: 400,
        error: 'Bad Request'
      })
    })
  })

  describe('Valid payload', () => {
    test('Should persist a new holding and return 201 with the persisted representation', async () => {
      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/holdings',
        payload: { cph: '12/345/6789', name: 'Green Acres Farm' }
      })

      expect(statusCode).toBe(201)
      expect(result).toEqual({
        cph: '12/345/6789',
        name: 'Green Acres Farm'
      })
    })

    test('Should persist a new holding with optional metadata and return 201', async () => {
      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/holdings',
        payload: {
          cph: '98/765/4321',
          name: 'Blue Meadow Farm',
          metadata: { region: 'south-west' }
        }
      })

      expect(statusCode).toBe(201)
      expect(result).toEqual({
        cph: '98/765/4321',
        name: 'Blue Meadow Farm',
        metadata: { region: 'south-west' }
      })
    })

    test('Should return 409 when a holding with the same cph already exists', async () => {
      const payload = { cph: '11/111/1111', name: 'Duplicate Farm' }

      const first = await server.inject({
        method: 'POST',
        url: '/holdings',
        payload
      })
      expect(first.statusCode).toBe(201)

      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/holdings',
        payload
      })

      expect(statusCode).toBe(409)
      expect(result).toMatchObject({ statusCode: 409, error: 'Conflict' })
    })
  })
})
