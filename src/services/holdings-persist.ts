import type { Db } from 'mongodb'
import type { Holding } from '#/services/holdings.js'
import { HoldingAlreadyExistsError } from '#/services/holdings-errors.js'

/** The Mongo error code for a unique index violation (duplicate key). */
const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000

/**
 * Inserts a new holding into the `holdings` collection.
 *
 * Relies on a unique index on `cph` to detect duplicates; a Mongo duplicate-key
 * error is translated into a {@link HoldingAlreadyExistsError} so the caller can
 * respond with `409 Conflict`. Any other error propagates unchanged.
 *
 * @param db - The Mongo database handle from the request.
 * @param holding - The holding to persist.
 * @returns The persisted holding representation.
 * @throws {HoldingAlreadyExistsError} If a holding with the same `cph` already exists.
 */
export async function insertHolding(
  db: Db,
  holding: Holding
): Promise<Holding> {
  try {
    await db.collection<Holding>('holdings').insertOne({ ...holding })
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw new HoldingAlreadyExistsError(holding.cph)
    }

    throw error
  }

  return holding
}

function isMongoDuplicateKeyError(
  error: unknown
): error is Error & { code: number } {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code: unknown }).code === MONGO_DUPLICATE_KEY_ERROR_CODE
  )
}
