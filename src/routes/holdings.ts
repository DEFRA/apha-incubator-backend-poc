import type { ServerRoute, Request, ResponseToolkit } from '@hapi/hapi'
import { holdingPayloadSchema } from '#/routes/holdings-schema.js'

/** Routes exposing holding registration via `POST /holdings`. */
export const holdings: ServerRoute[] = [
  {
    method: 'POST',
    path: '/holdings',
    options: {
      tags: ['api'],
      description: 'Register a new farm holding',
      validate: {
        payload: holdingPayloadSchema
      }
    },
    handler: async (_request: Request, h: ResponseToolkit) => {
      // Persistence and event publishing land in later PRs of this stack.
      return h.response().code(501)
    }
  }
]
