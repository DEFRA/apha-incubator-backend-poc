# Publishing holding lifecycle events to SNS

## Status

Accepted

## Context

`POST /holdings` persists a new holding to MongoDB (see PR 3 of this stack). Other
services/consumers need to be notified when a holding is registered, so a
`holding-events` SNS topic has already been provisioned locally via Floci and its ARN
is exposed through config (`holdingEvents.snsTopicArn`, PR 1 of this stack).

We need to decide:

1. When the publish happens relative to persistence.
2. What happens to the API response if the publish fails.
3. Which AWS SDK client to use and how it should be configured for local development
   vs deployed CDP environments.

The project already uses `@aws-sdk/credential-providers` for AWS credential resolution,
and local development already runs Floci (a LocalStack-like AWS emulator) with
`AWS_ENDPOINT_URL` set, so an AWS SDK v3 client picks up the local endpoint, region and
test credentials from environment variables without extra local-only branching in code.

The core trade-off is consistency vs availability: making the event publish part of the
same transaction as persistence would guarantee consumers never miss an event, but this
service has no distributed transaction/outbox mechanism, and Mongo/SNS cannot be
committed atomically without one. Given this is an early POC and building a full
transactional outbox is out of scope for this story, we accept at-least-once/best-effort
publishing for now and will not fail the client-facing response if only the notification
step fails.

## Decision

We will:

- Publish a `holding-created` event to the SNS topic identified by
  `config.holdingEvents.snsTopicArn` **after** the holding has been successfully
  persisted to MongoDB (persist-then-publish, not a single atomic transaction).
- Use `@aws-sdk/client-sns`'s `SNSClient`/`PublishCommand`, letting the SDK resolve
  region/credentials/endpoint from environment variables (already set for both local
  Floci and deployed CDP environments) rather than hardcoding configuration.
- Treat publish failures as **non-fatal to the API response**: if the SNS publish
  throws, the route still returns `201` with the persisted holding, and the failure is
  logged (ECS-compliant, via the `ecs-logging` skill) so it is observable and can be
  investigated/retried out of band.
- Not implement a transactional outbox or retry/dead-letter mechanism in this PR — this
  is deferred as follow-up work once the pattern is validated end-to-end.

## Consequences

- **Easier:** The API stays fast and available even if SNS/Floci is briefly unavailable;
  callers of `POST /holdings` are not coupled to the health of the notification pipeline.
- **Easier:** No local-only AWS configuration branching in application code — the AWS
  SDK's standard environment-variable resolution handles both Floci and real AWS.
- **Harder:** A publish failure means a holding can exist in MongoDB without a
  corresponding event ever reaching consumers ("at-least-once" is not actually
  guaranteed here — it's closer to "best-effort"). This is accepted for now but is a gap
  that should be revisited (e.g. via a transactional outbox or a scheduled
  reconciliation job) before this becomes a production dependency for other services.
- **Neutral:** Publish failures require structured, ECS-compliant logging so they can be
  found and acted on; this ADR does not define alerting/on-call process for that signal,
  which would need a follow-up if this becomes business-critical.
