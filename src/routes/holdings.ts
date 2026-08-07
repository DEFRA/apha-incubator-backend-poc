import Boom from '@hapi/boom'
import type { ServerRoute, Request, ResponseToolkit } from '@hapi/hapi'
import { holdingPayloadSchema } from '#/routes/holdings-schema.js'
import { insertHolding } from '#/services/holdings-persist.js'
import { HoldingAlreadyExistsError } from '#/services/holdings-errors.js'
import type { Holding } from '#/services/holdings.js'

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
    handler: async (request: Request, h: ResponseToolkit) => {
      const holding = request.payload as Holding

      try {
        const persisted = await insertHolding(request.db, holding)
        // Event publishing lands in a later PR of this stack.
        return h.response(persisted).code(201)
      } catch (error) {
        if (error instanceof HoldingAlreadyExistsError) {
          return Boom.conflict(error.message)
        }

        throw error
      }
    }
  }
]
