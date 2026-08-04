import type { Lock, LockManager } from 'mongo-locks'
import type { Logger } from 'pino'
import { acquireLock, requireLock } from '#/common/helpers/mongo-lock.js'

describe('Lock Functions', () => {
  let locker: Pick<LockManager, 'lock'>
  let logger: Pick<Logger, 'error'>

  beforeEach(() => {
    locker = {
      lock: vi.fn()
    }
    logger = {
      error: vi.fn()
    }
  })

  describe('acquireLock', () => {
    test('should acquire lock and return it', async () => {
      const resource = 'testResource'
      const mockLock = { id: 'lockId' } as unknown as Lock

      vi.mocked(locker.lock).mockResolvedValue(mockLock) // Mocking lock method to resolve a lock

      const result = await acquireLock(
        locker as LockManager,
        resource,
        logger as Logger
      )

      expect(result).toEqual(mockLock)
      expect(logger.error).not.toHaveBeenCalled()
      expect(locker.lock).toHaveBeenCalledWith(resource)
    })

    test('should log error and return null if lock cannot be acquired', async () => {
      const resource = 'testResource'

      vi.mocked(locker.lock).mockResolvedValue(null) // Mocking lock method to resolve to null

      const result = await acquireLock(
        locker as LockManager,
        resource,
        logger as Logger
      )

      expect(result).toBeNull()
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to acquire lock for ${resource}`
      )
      expect(locker.lock).toHaveBeenCalledWith(resource)
    })
  })

  describe('requireLock', () => {
    test('should acquire lock and return it', async () => {
      const resource = 'testResource'
      const mockLock = { id: 'lockId' } as unknown as Lock

      vi.mocked(locker.lock).mockResolvedValue(mockLock) // Mocking lock method to resolve a lock

      const result = await requireLock(locker as LockManager, resource)

      expect(result).toEqual(mockLock)
      expect(locker.lock).toHaveBeenCalledWith(resource)
    })

    test('should throw error if lock cannot be acquired', async () => {
      const resource = 'testResource'

      vi.mocked(locker.lock).mockResolvedValue(null) // Mocking lock method to resolve to null

      await expect(
        requireLock(locker as LockManager, resource)
      ).rejects.toThrow(`Failed to acquire lock for ${resource}`)
      expect(locker.lock).toHaveBeenCalledWith(resource)
    })
  })
})
