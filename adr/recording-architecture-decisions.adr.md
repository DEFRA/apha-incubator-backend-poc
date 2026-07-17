# Record architecture decisions

## Status

Accepted

## Context

As this service grows, significant technical and architectural decisions are being made
(framework choices, validation boundaries, logging conventions, and so on). Without a
durable record, the rationale behind these decisions is lost over time. New contributors —
human or agent — repeat past discussions, unknowingly contradict earlier choices, or
struggle to understand why the code is shaped the way it is.

We need a lightweight, low-friction way to capture decisions close to the code, in a
consistent format, that agents can reliably check before making significant changes.

## Decision

We will record significant, hard-to-reverse decisions as Architecture Decision Records
(ADRs) stored in the `adr/` directory at the repository root.

- One markdown file per decision.
- Filenames use a verb phrase describing the decision's purpose, suffixed with `.adr.md`
  (e.g. `handling-errors.adr.md`).
- Each ADR contains the sections: `Title`, `Status`, `Context`, `Decision`, and
  `Consequences`.
- `Status` is one of `Proposed`, `Accepted`, `Superseded`, or `Deprecated`.
- Agents and contributors must review existing ADRs before making significant changes,
  and author new ADRs using the shared `create-adr` skill.

## Consequences

- Decisions and their rationale are preserved alongside the code and versioned with it.
- Agents have an explicit, checkable source of truth to consult before significant work,
  reducing accidental contradictions of prior decisions.
- A small amount of ongoing effort is required to author ADRs and to keep statuses up to
  date (e.g. marking a decision `Superseded` when it is replaced).
- Superseding a decision requires creating a new ADR rather than editing history, which
  keeps the trail of reasoning intact.
