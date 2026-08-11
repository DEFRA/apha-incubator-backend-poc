import Boom from '@hapi/boom'
import type { ServerRoute, Request, ResponseToolkit } from '@hapi/hapi'
import { holdingPayloadSchema } from '#/routes/holdings-schema.js'
import { insertHolding } from '#/services/holdings-persist.js'
import { HoldingAlreadyExistsError } from '#/services/holdings-errors.js'
import { publishHoldingCreated } from '#/services/holdings-events.js'
import { buildHoldingPublishErrorLog } from '#/common/helpers/logging/build-holding-publish-error-log.js'
import { config } from '#/config.js'
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

      let persisted: Holding
      try {
        persisted = await insertHolding(request.db, holding)
      } catch (error) {
        if (error instanceof HoldingAlreadyExistsError) {
          return Boom.conflict(error.message)
        }

        throw error
      }

      // A publish failure must not fail the response — see
      // adr/publishing-holding-lifecycle-events.adr.md.
      try {
        await publishHoldingCreated(
          request.snsClient,
          config.get('holdingEvents').snsTopicArn,
          persisted
        )
      } catch (error) {
        request.logger.error(
          buildHoldingPublishErrorLog(persisted, error as Error)
        )
      }

      return h.response(persisted).code(201)
    }
  }
]
