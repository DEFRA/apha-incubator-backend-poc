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
    test('Should pass validation and reach the handler for a minimal valid payload', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/holdings',
        payload: { cph: '12/345/6789', name: 'Green Acres Farm' }
      })

      // Persistence/response shape land in a later PR of this stack; the
      // temporary handler returns 501 to prove validation let this through.
      expect(statusCode).toBe(501)
    })

    test('Should pass validation and reach the handler when optional metadata is provided', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/holdings',
        payload: {
          cph: '12/345/6789',
          name: 'Green Acres Farm',
          metadata: { region: 'south-west' }
        }
      })

      expect(statusCode).toBe(501)
    })
  })
})
