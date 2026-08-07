/**
 * Thrown when attempting to persist a holding whose `cph` has already been
 * registered, so callers (e.g. the `POST /holdings` route) can translate it
 * into a `409 Conflict` response.
 */
export class HoldingAlreadyExistsError extends Error {
  constructor(cph: string) {
    super(`A holding with cph "${cph}" already exists`)
    this.name = 'HoldingAlreadyExistsError'
  }
}
