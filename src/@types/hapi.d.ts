import type { Db, MongoClient } from 'mongodb'
import type { LockManager } from 'mongo-locks'
import type { SNSClient } from '@aws-sdk/client-sns'

// Sanctioned module augmentation (per AGENTS.md): declares the server/request
// decorations added at runtime by the mongodb and sns plugins
// (`src/plugins/mongodb.ts`, `src/plugins/sns.ts`) so consumers (routes/services)
// type-check without casts.
declare module '@hapi/hapi' {
  interface Server {
    mongoClient: MongoClient
    db: Db
    locker: LockManager
    snsClient: SNSClient
  }

  interface Request {
    db: Db
    locker: LockManager
    snsClient: SNSClient
  }
}
