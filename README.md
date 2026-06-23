# RegWatch NG

An NDPC (Nigeria Data Protection Commission) **regulator console** and **public
transparency platform** in one Next.js app, separated by a hard confidentiality
boundary.

- **Console** (`/(console)`) — authenticated NDPC staff: dashboard,
  investigations, complaints, notices, remediation, settlements (Modules 12 & 13).
- **Public** (`/(public)`) — citizens, no auth: transparency portal and the data
  subject rights portal (Modules 14 & 15).

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind v4 · Prisma + SQLite ·
Recharts · Vitest. Path alias `@/` → `./src`.

## Getting started

```bash
pnpm install
cp .env.example .env          # then set AUTH_SECRET (openssl rand -hex 32)
pnpm db:migrate               # apply migrations, create prisma/dev.db
pnpm db:seed                  # load the fictional Nigerian dataset
pnpm dev                      # http://localhost:3000
```

Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `db:migrate`, `db:seed`,
`db:reset`, `db:generate`. Health check: `GET /api/health`.

> If `tsx`/`vitest` hit `EACCES … mkdir … /T/` in a sandboxed shell, prefix with
> `TMPDIR="$PWD/.tmp"`.

### Demo accounts (password `RegWatch#2026`)

| Email | Role |
|---|---|
| aisha.bello@ndpc.gov.ng | superadmin |
| chidi.okeke@ndpc.gov.ng | investigator |
| ngozi.eze@ndpc.gov.ng | analyst |
| tunde.adeyemi@ndpc.gov.ng | settlement_officer |
| fatima.sani@ndpc.gov.ng | read_only |

## The confidentiality boundary

Every model that can ever be public carries `visibility` (`internal` | `public`)
and `publishedAt`. **Nothing is public unless `visibility = "public"` AND
`publishedAt != null`.** Default is `internal`, so data is private by default.

**Read side — `src/lib/public-data.ts`.** The public portal reads *only* through
this module. Two enforced guarantees:

1. **Compile-time** — `publicReader` is typed `Pick<PrismaClient, …>` exposing
   only safe delegates (`organization`, `sector`, `complianceTrend`, `advisory`,
   `certification`, `settlement`). Confidential delegates (`investigation`,
   `evidence`, `complaint`, `settlementMilestone`, `dataSubjectRequest`,
   `remediationAction`, `auditLog`, `regulatorUser`) are absent from its type —
   `publicReader.evidence` does not compile.
2. **Runtime** — every query filters published rows and projects to DTOs that
   omit internal fields (raw `riskScore` → coarse `riskBand`; settlement progress
   → a sanitized `publishedProgress` snapshot, never milestone evidence).

**Write side — `src/lib/publish.ts`.** The only path that makes internal records
public. Each `publish*` action sets `visibility/publishedAt` and copies across
*only* safe fields (it never copies evidence or complainant identity), and is
audit-logged.

### What becomes public, exactly

| Model | Public fields (via DTO) | Never public |
|---|---|---|
| Organization | name, sector, **riskBand**, certified | riskScore, consentRisk, crossBorderRisk |
| ComplianceTrend | sector, period, avg score (aggregate) | — |
| Certification | scheme, certNumber, status, dates | — |
| Advisory | title, summary, type, severity, sector, display label | linked org identity unless overridden |
| Settlement | org, **publicSummary**, **publishedProgress %**, status | totalFine, milestones, evidence |
| Investigation / Evidence / Complaint / DSR | **nothing** | everything |

## Auth, roles & audit

Email + password (bcrypt) with an HMAC-signed session cookie (`src/lib/auth`).
`src/proxy.ts` redirects unauthenticated console requests to `/login`. RBAC via
`can(user, action)` across 5 roles (e.g. an analyst cannot issue notices).
Sensitive actions — viewing evidence, issuing notices, verifying settlement
evidence — write `AuditLog` rows.

## Tests

```bash
pnpm test
```

Boundary tests assert the public layer returns no internal rows, the
internal-only org/advisory/settlement never surface, confidential delegates are
unreachable, RBAC blocks analysts from issuing notices, evidence views are
audited, settlement progress is computed correctly, and overdue DSRs escalate.
