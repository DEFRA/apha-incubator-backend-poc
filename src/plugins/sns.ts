import { SNSClient } from '@aws-sdk/client-sns'
import type { Server } from '@hapi/hapi'

/** Hapi plugin that creates an SNS client and decorates the server/request with it. */
export const sns = {
  plugin: {
    name: 'sns',
    version: '1.0.0',
    register: (server: Server): void => {
      // Region, credentials and endpoint (for local Floci) are resolved from
      // environment variables by the AWS SDK's standard provider chain.
      const snsClient = new SNSClient({})

      server.decorate('server', 'snsClient', snsClient)
      server.decorate('request', 'snsClient', () => snsClient, { apply: true })
    }
  }
}
