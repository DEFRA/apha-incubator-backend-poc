/** Runtime configuration for the MongoDB connection, as read from convict. */
export type MongoConfig = {
  mongoUrl: string
  databaseName: string
  mongoOptions: {
    retryWrites: boolean | null
    readPreference:
      | 'primary'
      | 'primaryPreferred'
      | 'secondary'
      | 'secondaryPreferred'
      | 'nearest'
      | null
  }
}

/** Runtime configuration for structured (Pino) logging, as read from convict. */
export type LogConfig = {
  isEnabled: boolean
  level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'
  format: 'ecs' | 'pino-pretty'
  redact: string[]
}

/** Runtime configuration for CDP request tracing, as read from convict. */
export type TracingConfig = {
  header: string
}

/** The CDP environment the service is running in. */
export type CdpEnvironment =
  | 'local'
  | 'infra-dev'
  | 'management'
  | 'dev'
  | 'test'
  | 'perf-test'
  | 'ext-test'
  | 'prod'

/** The full application configuration shape validated by convict at startup. */
export type AppConfig = {
  serviceVersion: string | null
  host: string
  port: number
  serviceName: string
  cdpEnvironment: CdpEnvironment
  log: LogConfig
  mongo: MongoConfig
  httpProxy: string | null
  tracing: TracingConfig
}
