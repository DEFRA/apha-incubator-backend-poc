import type { Server, ServerRoute } from '@hapi/hapi'

import { health } from '#/routes/health.js'
import { example } from '#/routes/example.js'

export const router = {
  plugin: {
    name: 'router',
    register: (server: Server): void => {
      // `health`/`example` are converted to typed `ServerRoute`s in step 05; this
      // assertion is a temporary bridge until then.
      server.route(([health] as ServerRoute[]).concat(example as ServerRoute[]))
    }
  }
}
