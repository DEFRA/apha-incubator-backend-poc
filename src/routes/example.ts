import Boom from '@hapi/boom'
import Joi from 'joi'
import type { ServerRoute, Request, ResponseToolkit } from '@hapi/hapi'
import { findAllExampleData, findExampleData } from '#/services/example-find.js'

/** Validates the `exampleId` path parameter for the single-example route. */
const exampleParamsSchema = Joi.object({
  exampleId: Joi.string().required()
})

/** Routes exposing example records from the `example-data` collection. */
export const example: ServerRoute[] = [
  {
    method: 'GET',
    path: '/example',
    handler: async (request: Request, h: ResponseToolkit) => {
      const entities = await findAllExampleData(request.db)
      return h.response(entities)
    }
  },
  {
    method: 'GET',
    path: '/example/{exampleId}',
    options: {
      validate: {
        params: exampleParamsSchema
      }
    },
    handler: async (request: Request, h: ResponseToolkit) => {
      const { exampleId } = request.params as { exampleId: string }
      const entity = await findExampleData(request.db, exampleId)

      if (!entity) {
        return Boom.notFound()
      }

      return h.response(entity)
    }
  }
]
