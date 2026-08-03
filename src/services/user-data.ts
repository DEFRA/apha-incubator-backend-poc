import { z } from 'zod'

export const USER_NAME_MIN_LENGTH = 2
export const USER_NAME_MAX_LENGTH = 100
export const USER_AGE_MIN = 0
export const USER_AGE_MAX = 150

/** Runtime schema for a record in the `users` collection. */
export const userDataSchema = z.object({
  name: z.string().min(USER_NAME_MIN_LENGTH).max(USER_NAME_MAX_LENGTH),
  age: z.number().int().min(USER_AGE_MIN).max(USER_AGE_MAX)
})

/** Static type for a user record, derived from {@link userDataSchema}. */
export type UserData = z.infer<typeof userDataSchema>
