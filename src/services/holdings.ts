import { z } from 'zod'

/** Runtime schema for a farm holding persisted in the `holdings` collection. */
export const holdingSchema = z.object({
  cph: z.string(),
  name: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

/** Static type for a holding, derived from {@link holdingSchema}. */
export type Holding = z.infer<typeof holdingSchema>
