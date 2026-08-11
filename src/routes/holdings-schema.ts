import Joi from 'joi'

/** Joi payload schema for `POST /holdings`, validated at the Hapi route boundary. */
export const holdingPayloadSchema = Joi.object({
  cph: Joi.string()
    .pattern(/^\d{2}\/\d{3}\/\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'cph must be in the format NN/NNN/NNNN'
    }),
  name: Joi.string().required(),
  metadata: Joi.object().unknown(true)
})
