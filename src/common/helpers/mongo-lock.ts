import type { LockManager, Lock } from 'mongo-locks'
import type { Logger } from 'pino'

/**
 * Attempts to acquire a lock on the given resource, logging (but not throwing)
 * if it cannot be acquired.
 *
 * @param locker - The lock manager to acquire the lock from.
 * @param resource - The resource identifier to lock.
 * @param logger - Optional logger used to report a failed acquisition.
 * @returns The acquired lock, or `null` if it could not be acquired.
 */
export async function acquireLock(
  locker: LockManager,
  resource: string,
  logger?: Logger
): Promise<Lock | null> {
  const lock = await locker.lock(resource)
  if (!lock) {
    if (logger) {
      logger.error(`Failed to acquire lock for ${resource}`)
    }
    return null
  }
  return lock
}

/**
 * Acquires a lock on the given resource, throwing if it cannot be acquired.
 *
 * @param locker - The lock manager to acquire the lock from.
 * @param resource - The resource identifier to lock.
 * @returns The acquired lock.
 * @throws {Error} If the lock could not be acquired.
 */
export async function requireLock(
  locker: LockManager,
  resource: string
): Promise<Lock> {
  const lock = await locker.lock(resource)
  if (!lock) {
    throw new Error(`Failed to acquire lock for ${resource}`)
  }
  return lock
}
