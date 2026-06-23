# `api/console` — authenticated route handlers

Route handlers on the **trusted** side of the confidentiality boundary.

- Requests here MUST be authenticated as a `RegulatorUser` (enforced by the
  `(console)` middleware / session check added in Prompt 3).
- Handlers may read confidential models directly (Investigation, Evidence,
  Complaint internals, raw Settlement evidence).
- Sensitive actions write an `AuditLog` entry.

Nothing under this path may be reachable without a valid console session.
