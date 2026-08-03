import type { Db } from 'mongodb'
import type { UserData } from '#/services/user-data.js'

/** A user record as returned to API consumers, including its string id. */
export interface InsertedUser extends UserData {
  id: string
}

/**
 * Inserts a new user record into the `users` collection.
 *
 * @param db - The Mongo database handle from the request.
 * @param data - The validated user data to store.
 * @returns The created user, including its generated id.
 */
export async function insertUser(
  db: Db,
  data: UserData
): Promise<InsertedUser> {
  const { insertedId } = await db.collection<UserData>('users').insertOne(data)

  return { id: insertedId.toString(), ...data }
}
