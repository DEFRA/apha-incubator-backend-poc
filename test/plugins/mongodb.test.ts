import { Db, MongoClient } from 'mongodb'
import { LockManager } from 'mongo-locks'
import type { Server } from '@hapi/hapi'
import { createServer } from '#/server.js'

async function createInitializedServer(): Promise<Server> {
  const server = await createServer()
  await server.initialize()
  return server
}

describe('#mongoDb', () => {
  let server: Server

  describe('Set up', () => {
    beforeAll(async () => {
      server = await createInitializedServer()
    }, 30000)

    test('Server should have expected MongoDb decorators', () => {
      expect(server.db).toBeInstanceOf(Db)
      expect(server.mongoClient).toBeInstanceOf(MongoClient)
      expect(server.locker).toBeInstanceOf(LockManager)
    })

    test('MongoDb should have expected database name', () => {
      expect(server.db.databaseName).toBe('apha-incubator-backend-poc')
    })

    test('MongoDb should have expected namespace', () => {
      expect(server.db.namespace).toBe('apha-incubator-backend-poc')
    })
  })

  describe('Shut down', () => {
    beforeAll(async () => {
      server = await createInitializedServer()
    }, 30000)

    test('Should close Mongo client on server stop', async () => {
      const closeSpy = vi.spyOn(server.mongoClient, 'close')
      await server.stop({ timeout: 1000 })

      expect(closeSpy).toHaveBeenCalledWith(true)
    })
  })
})
