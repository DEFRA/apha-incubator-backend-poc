import type { Db } from 'mongodb'
import type { ExampleData } from '#/services/example-data.js'

/**
 * Retrieves all example records, with the internal Mongo `_id` projected out.
 *
 * @param db - The Mongo database handle from the request.
 * @returns All example records.
 */
export function findAllExampleData(db: Db): Promise<ExampleData[]> {
  return db
    .collection<ExampleData>('example-data')
    .find({}, { projection: { _id: 0 } })
    .toArray()
}

/**
 * Retrieves a single example record by its example id.
 *
 * @param db - The Mongo database handle from the request.
 * @param id - The `exampleId` to look up.
 * @returns The matching record, or `null` if none exists.
 */
export function findExampleData(
  db: Db,
  id: string
): Promise<ExampleData | null> {
  return db
    .collection<ExampleData>('example-data')
    .findOne({ exampleId: id }, { projection: { _id: 0 } })
}
