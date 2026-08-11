import { holdingPayloadSchema } from '#/routes/holdings-schema.js'

describe('#holdingPayloadSchema', () => {
  test.each([
    ['cph is missing', { name: 'Green Acres Farm' }, 'cph'],
    ['name is missing', { cph: '12/345/6789' }, 'name'],
    [
      'cph is not in the NN/NNN/NNNN format',
      { cph: 'not-a-cph', name: 'Green Acres Farm' },
      'cph'
    ],
    ['name is an empty string', { cph: '12/345/6789', name: '' }, 'name'],
    [
      'metadata is not an object',
      {
        cph: '12/345/6789',
        name: 'Green Acres Farm',
        metadata: 'not-an-object'
      },
      'metadata'
    ]
  ])('Should fail validation when %s', (_description, payload, field) => {
    const result = holdingPayloadSchema.validate(payload)

    expect(result.error).toBeDefined()
    expect(result.error?.details).toHaveLength(1)
    expect(result.error?.details.at(0)?.path).toEqual([field])
  })

  test('Should pass validation for a minimal valid payload', () => {
    const result = holdingPayloadSchema.validate({
      cph: '12/345/6789',
      name: 'Green Acres Farm'
    })

    expect(result.error).toBeUndefined()
  })

  test('Should pass validation when optional metadata is provided', () => {
    const result = holdingPayloadSchema.validate({
      cph: '12/345/6789',
      name: 'Green Acres Farm',
      metadata: { region: 'south-west' }
    })

    expect(result.error).toBeUndefined()
  })
})
