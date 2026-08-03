import { userPayloadSchema } from '#/routes/user.js'

const getValidationMessage = (payload: unknown): string | undefined =>
  userPayloadSchema.validate(payload).error?.message

describe('#user payload validation', () => {
  test('Should reject payload missing name', () => {
    expect(getValidationMessage({ age: 30 })).toContain('"name" is required')
  })

  test('Should reject payload missing age', () => {
    expect(getValidationMessage({ name: 'Alice' })).toContain('"age" is required')
  })

  test('Should reject name shorter than 2 characters', () => {
    expect(getValidationMessage({ name: 'A', age: 30 })).toContain(
      '"name" length must be at least 2 characters long'
    )
  })

  test('Should reject name longer than 100 characters', () => {
    expect(
      getValidationMessage({
        name: 'A'.repeat(101),
        age: 30
      })
    ).toContain(
      '"name" length must be less than or equal to 100 characters long'
    )
  })

  test('Should reject non-string name', () => {
    expect(getValidationMessage({ name: 123, age: 30 })).toContain(
      '"name" must be a string'
    )
  })

  test('Should reject non-integer age', () => {
    expect(getValidationMessage({ name: 'Alice', age: 30.5 })).toContain(
      '"age" must be an integer'
    )
  })

  test('Should reject negative age', () => {
    expect(getValidationMessage({ name: 'Alice', age: -1 })).toContain(
      '"age" must be greater than or equal to 0'
    )
  })

  test('Should reject age above sensible upper bound', () => {
    expect(getValidationMessage({ name: 'Alice', age: 151 })).toContain(
      '"age" must be less than or equal to 150'
    )
  })

  test('Should accept a valid payload', () => {
    expect(getValidationMessage({ name: 'Alice', age: 30 })).toBeUndefined()
  })
})
