import { MongoClient, type Db, type MongoClientOptions } from 'mongodb'
import { LockManager } from 'mongo-locks'
import type { Server } from '@hapi/hapi'
import type { MongoConfig } from '#/common/types/index.js'

/** Hapi plugin that connects to MongoDB and decorates the server with `db`, `mongoClient` and `locker`. */
export const mongoDb = {
  plugin: {
    name: 'mongodb',
    version: '1.0.0',
    register: async (server: Server, options: MongoConfig): Promise<void> => {
      server.logger.info('Setting up MongoDb')

      const client = await MongoClient.connect(
        options.mongoUrl,
        toMongoClientOptions(options.mongoOptions)
      )

      const databaseName = options.databaseName
      const db = client.db(databaseName)
      const locker = new LockManager(db.collection('mongo-locks'))

      await createIndexes(db)

      server.logger.info(`MongoDb connected to ${databaseName}`)

      server.decorate('server', 'mongoClient', client)
      server.decorate('server', 'db', db)
      server.decorate('server', 'locker', locker)
      server.decorate('request', 'db', () => db, { apply: true })
      server.decorate('request', 'locker', () => locker, { apply: true })

      server.events.on('stop', async () => {
        server.logger.info('Closing Mongo client')
        try {
          await client.close(true)
        } catch (e) {
          server.logger.error(e, 'failed to close mongo client')
        }
      })
    }
  }
}

async function createIndexes(db: Db): Promise<void> {
  await db.collection('mongo-locks').createIndex({ id: 1 })

  // Example of how to create a mongodb index. Remove as required
  await db.collection('example-data').createIndex({ id: 1 })
}

/**
 * Converts the convict-sourced Mongo options into `MongoClientOptions`,
 * dropping unset (`null`) fields so they're treated as not provided,
 * matching the original config's "nullable = not overridden" semantics.
 */
function toMongoClientOptions(
  mongoOptions: MongoConfig['mongoOptions']
): MongoClientOptions {
  const options: MongoClientOptions = {}

  if (mongoOptions.retryWrites !== null) {
    options.retryWrites = mongoOptions.retryWrites
  }

  if (mongoOptions.readPreference !== null) {
    options.readPreference = mongoOptions.readPreference
  }

  return options
}
