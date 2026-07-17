import type { Server } from '@hapi/hapi'

import { config } from '#/config.js'

import { createServer } from '#/server.js'

/**
 * Creates and starts the Hapi server, logging its startup URL.
 *
 * @returns The started server instance.
 */
export async function startServer(): Promise<Server> {
  const server = await createServer()
  await server.start()

  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your backend on http://localhost:${config.get('port')}`
  )

  return server
}
