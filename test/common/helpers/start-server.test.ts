import hapi from '@hapi/hapi'
import type { MockInstance } from 'vitest'
import type * as ServerModule from '#/server.js'
import type * as StartServerModule from '#/common/helpers/start-server.js'

describe('#startServer', () => {
  let createServerSpy: MockInstance<typeof ServerModule.createServer>
  let hapiServerSpy: MockInstance<typeof hapi.server>
  let startServerImport: typeof StartServerModule
  let createServerImport: typeof ServerModule

  beforeAll(async () => {
    vi.stubEnv('PORT', '3098')
    createServerImport = await import('#/server.js')
    startServerImport = await import('#/common/helpers/start-server.js')

    createServerSpy = vi.spyOn(createServerImport, 'createServer')
    hapiServerSpy = vi.spyOn(hapi, 'server')
  })

  afterAll(() => {
    vi.resetAllMocks()
  })

  describe('When server starts', () => {
    test('Should start up server as expected', async () => {
      await startServerImport.startServer()

      expect(createServerSpy).toHaveBeenCalled()
      expect(hapiServerSpy).toHaveBeenCalled()
    })
  })

  describe('When server start fails', () => {
    test('Should log failed startup message', async () => {
      createServerSpy.mockRejectedValue(new Error('Server failed to start'))

      await expect(startServerImport.startServer()).rejects.toThrow(
        'Server failed to start'
      )
    })
  })
})
