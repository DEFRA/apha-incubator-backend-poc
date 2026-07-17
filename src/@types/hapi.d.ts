import type { Db, MongoClient } from 'mongodb'
import type { LockManager } from 'mongo-locks'

// Sanctioned module augmentation (per AGENTS.md): declares the server/request
// decorations added at runtime by the mongodb plugin (`src/plugins/mongodb.ts`)
// so consumers (routes/services) type-check without casts.
declare module '@hapi/hapi' {
  interface Server {
    mongoClient: MongoClient
    db: Db
    locker: LockManager
  }

  interface Request {
    db: Db
    locker: LockManager
  }
}
