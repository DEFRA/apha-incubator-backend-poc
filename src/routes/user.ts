import Boom from '@hapi/boom'
import Joi from 'joi'
import type { ServerRoute, Request, ResponseToolkit } from '@hapi/hapi'
import { insertUser } from '#/services/user-insert.js'
import {
  USER_AGE_MAX,
  USER_AGE_MIN,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH
} from '#/services/user-data.js'
import type { UserData } from '#/services/user-data.js'

/** Validates the payload for creating a new user record. */
export const userPayloadSchema = Joi.object({
  name: Joi.string()
    .min(USER_NAME_MIN_LENGTH)
    .max(USER_NAME_MAX_LENGTH)
    .required(),
  age: Joi.number().integer().min(USER_AGE_MIN).max(USER_AGE_MAX).required()
})

/** Routes for creating user records in the `users` collection. */
export const user: ServerRoute[] = [
  {
    method: 'POST',
    path: '/user',
    options: {
      tags: ['api'],
      description: 'Create a new user record',
      validate: {
        payload: userPayloadSchema
      },
      response: {
        status: {
          201: Joi.object({
            id: Joi.string(),
            name: Joi.string(),
            age: Joi.number()
          }),
          400: Joi.any()
        }
      }
    },
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as UserData
        const created = await insertUser(request.db, payload)
        return h.response(created).code(201)
      } catch (error) {
        throw Boom.badImplementation('Failed to create user', error)
      }
    }
  }
]
