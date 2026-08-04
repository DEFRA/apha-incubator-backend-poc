import Joi from 'joi'

/**
 * Convict format that validates a value is a well-formed MongoDB connection URI.
 *
 * @throws {Error} If the provided value is not a valid Mongo URI.
 */
export const convictValidateMongoUri = {
  name: 'mongo-uri',
  validate(value: string): void {
    const mongodbSchema = Joi.string().uri({
      scheme: ['mongodb']
    })

    Joi.assert(value, mongodbSchema)
  }
}
