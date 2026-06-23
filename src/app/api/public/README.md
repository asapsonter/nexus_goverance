# `api/public` — unauthenticated route handlers

Route handlers on the **public** side of the confidentiality boundary.

- No authentication required.
- Handlers MUST read only through `lib/public-data.ts`, which returns only
  `visibility = public` + `publishedAt != null`, anonymized/aggregated rows.
- There is no code path from here to Evidence / Investigation / raw Complaint
  or Settlement-evidence tables.

If a handler here needs a field that isn't published, the answer is to publish
it through the Prompt 8 pipeline — never to query the confidential tables.
