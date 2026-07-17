import type { ServerRoute, Request, ResponseToolkit } from '@hapi/hapi'

/** Health-check route used by the CDP platform to verify the service is up. */
export const health: ServerRoute = {
  method: 'GET',
  path: '/health',
  handler: (_request: Request, h: ResponseToolkit) =>
    h.response({ message: 'success' })
}
