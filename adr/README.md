# Architecture Decision Records (ADRs)

This directory records the significant, hard-to-reverse decisions made on this service,
so the rationale behind them is preserved and future changes stay consistent.

## Check ADRs first

**Before making any significant change, read the ADRs in this directory.** Align your
work with accepted decisions. If a change contradicts an existing ADR, do not silently
diverge — create a new ADR that supersedes it and set the old one's status to
`Superseded`.

## When to create an ADR

Create an ADR for significant decisions such as:

- Architectural patterns and structure
- Data models
- Cross-cutting conventions
- Dependency / library choices
- Security boundaries
- Error-handling strategy
- Anything expensive or painful to reverse

Routine, low-impact changes do not need an ADR.

## Format

Each ADR lives in **its own file** and must contain these sections:

| Section        | Purpose                                                             |
| -------------- | ------------------------------------------------------------------- |
| `Title`        | Short, descriptive name of the decision.                            |
| `Status`       | One of `Proposed`, `Accepted`, `Superseded`, `Deprecated`.          |
| `Context`      | The forces at play: the problem, constraints, and background.       |
| `Decision`     | The decision that was made, stated in active voice.                 |
| `Consequences` | The resulting trade-offs — positive, negative, and neutral.         |

See [`template.adr.md`](template.adr.md) for a starting point.

## Naming

Use a **verb phrase describing the decision's purpose**, suffixed with `.adr.md`:

- `handling-errors.adr.md`
- `choosing-validation-library.adr.md`
- `recording-architecture-decisions.adr.md`

## Authoring

Use the `create-adr` skill to generate ADRs so they stay consistent across services.
Do not hand-roll the ADR shape.
