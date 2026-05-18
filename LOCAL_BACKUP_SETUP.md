# Local backup setup

> **ARCHIVED / HISTORICAL** — this document records a past migration effort (Neon → AWS RDS) that is no longer relevant. The current database is **Neon serverless PostgreSQL** (`ep-broad-shadow-anqzuaqr.c-6.us-east-1.aws.neon.tech/neondb`), shared by both Hephaestus and Chronos. The old RDS instance (`flolabs-chronos-db`) was decommissioned in 2026-05. The Strapi build blocker described here is also historical. This file is kept for audit purposes only.

---

## Chronos

### Current AWS state
- AWS account: `975049954782`
- RDS instance: `flolabs-chronos-db`
- App Runner service URL: `https://hcmsmnfq5q.us-east-1.awsapprunner.com`
- Repo already contains AWS deployment scripts in `deploy/aws/`

### Important blocker
- The old Neon source database currently rejects connections with a quota error.
- Until that quota is reset or an alternate dump is provided, live data cannot be copied out of Neon.

### Local env sources
- Runtime env lives in `.env.local` / `.env.production.local`
- AWS provisioning output is in `deploy/aws/provision-output.json` (gitignored)

### Verified locally
- `pnpm build` succeeds
- AWS RDS accepts direct Postgres connections
- AWS target DB already contains Chronos tables

## Hephaestus

### Frontend local backup env
Created `frontend/.env.local` with:
- OpenAI key already present in repo local env
- Chronos AWS Postgres URL for applicant storage
- Strapi URL/token values from existing team env
- Vercel blob token from existing team env

### Frontend verification
- `npm run build` succeeds in `frontend/`

### Strapi local backup env
Created `strapi/app/.env.local` with local SQLite defaults so the CMS can run standalone without Railway.

### Strapi status
- Dependency install completed
- Build is still blocked by a Strapi package/version mismatch during admin bundling:
  - `@strapi/upload` imports `useAIAvailability` from `@strapi/admin`, but that export is missing in the installed package set
- This is a dependency consistency issue, not a missing credential.

## Recommended next actions
1. Restore Chronos source DB access, then dump/copy Neon into AWS RDS.
2. For Hephaestus Strapi, align Strapi package versions or reinstall from a known-good lockfile state, then build again.
3. After Chronos App Runner finishes provisioning, smoke-test login, API, and DB connectivity.
