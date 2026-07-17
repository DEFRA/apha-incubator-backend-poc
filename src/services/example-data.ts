import { z } from 'zod'

/** Runtime schema for a record in the `example-data` collection. */
export const exampleDataSchema = z.object({
  exampleId: z.string(),
  name: z.string()
})

/** Static type for an example record, derived from {@link exampleDataSchema}. */
export type ExampleData = z.infer<typeof exampleDataSchema>
