# CURSOR.md — Hephaestus Continuation Prompt

Paste this entire file into Cursor (or any AI coding assistant) to continue where work left off.

---

## Context

You are working on **Hephaestus** (`hephaestus-international`), FloLabs' internship applicant tracking platform, and **Chronos** (`FloLabs_Chronos`), the time-tracking system. Both share a single **AWS RDS PostgreSQL 16** database and a single identity table `flolabs_users`.

### AWS Infrastructure (as of 2026-06-01)

- **Database**: **AWS RDS PostgreSQL 16** — `flolabs-db.ccxceiswgkrj.us-east-1.rds.amazonaws.com/neondb`. Migrated from Neon 2026-06-01. Private (VPC-only, no public access).
- **DATABASE_URL SSM param**: `/flolabs-chronos/DATABASE_URL` (shared by both apps — updated to RDS on 2026-06-01)
- **Hephaestus App Runner**: `hephaestus-international` — URL: `https://fykgssqbvg.us-east-1.awsapprunner.com`
- **Chronos App Runner**: `flolabs-chronos` — URL: `https://hcmsmnfq5q.us-east-1.awsapprunner.com`
- **Production domain (Hephaestus)**: `https://efestos.international` (also `https://hephaestus.international`)
- **Production domain (Chronos)**: `https://athensgreecemarathon.com`

### Shared Database Architecture

Both apps connect to the same **RDS PostgreSQL** database (`neondb` database on `flolabs-db`) via the same connection string from SSM.

- `flolabs_users` — unified identity table (owned by Hephaestus DDL, Chronos uses Drizzle ORM schema against it)
- Chronos tables: `teams`, `time_entries`, `team_memberships`, `tags`, `time_entry_tags`, `projects`, etc.
- Hephaestus tables: `website_applicant_conversations`, `website_applicant_stage_transitions`, `website_stage_resources`, `website_stage_resource_responses`, `website_stage_definitions`, `website_stage_ai_reviews`, `website_password_reset_tokens`

**Critical rule**: Hephaestus runs DDL against `flolabs_users` at startup via `ensurePostgresSchema()`. Chronos uses Drizzle `pnpm db:push` for migrations. Never have Hephaestus run `ALTER TABLE` without first checking column existence — ACCESS EXCLUSIVE lock blocks all Chronos reads.

**Cross-system ownership**: Hephaestus HR **owns** `graduated`, `terminated`, and permanent delete of users. Chronos displays `flolabs_users.status` read-only. `graduated`/`terminated` users cannot sign in to Chronos (`is_active = false`).

---

## Current State (as of 2026-05-18)

### Hephaestus — latest deployed commit: `6f74491`

**What was fixed:**
1. `ensurePostgresSchema()` in `frontend/lib/application-db.ts` — added fast-path guard. Checks if `low_effort_rollback_after` column exists first; if yes, skips ALL DDL (prevents 60+ second login latency on cold start).
2. `ensureStageFeatureSchema()` — converted to a cached promise via `getStageSchemaReady()` so ALTER TABLE only runs once per process instead of on every call from 14 call sites.
3. `ALTER TABLE ADD COLUMN IF NOT EXISTS` in `ensureStageFeatureSchema()` — replaced with explicit `information_schema.columns` check to avoid ACCESS EXCLUSIVE lock on `website_stage_definitions`.
4. `ensureApplicantLowEffortHoldColumns()` — same fix applied in previous commit (`1a0394a`).

**What still needs to be done:**
1. **Hephaestus HR E2E tests** — re-run after `6f74491` deploys and confirm they pass. Tests are in `e2e/hr-stage-lifecycle.spec.ts` and `e2e/hr-status-filter.spec.ts`.
2. **`hr_binary_role` for HR test user** — after every new App Runner deploy, run:
   ```bash
   curl -X POST "https://fykgssqbvg.us-east-1.awsapprunner.com/api/admin/bootstrap" \
     -H "Content-Type: application/json" \
     -d '{"secret":"6IXvIoMfk8MCMOvWzBPAWgnlwl0T6gAPaAxpYMtO8xkA","email":"zoom@flomadlabs.com"}'
   ```
   Expected response: `{"ok":true,"action":"updated","user":{"hr_binary_role":true}}`

### Chronos — latest deployed commit: `e78182c`

**All 16 Playwright E2E tests pass.** Work was completed in the previous session.

---

## HR Test User Credentials

```json
{
  "email": "zoom@flomadlabs.com",
  "password": "gq2A1xZ^CdMM#uUpJnfc",
  "role": "Human Resources"
}
```

This user must have `hr_binary_role = true` in `flolabs_users` to access `/me/hr`. Bootstrap API sets this.

---

## How to Run Hephaestus E2E Tests

```bash
cd hephaestus-international
# First ensure hr_binary_role is set (see above)
# Then:
npx playwright test e2e/hr-stage-lifecycle.spec.ts e2e/hr-status-filter.spec.ts --config playwright.config.ts
```

Test timeout for `waitForURL(/\/me\/hr/)` is 90 seconds (up from 60) to account for the one-time schema check on first cold start.

## How to Validate a Hephaestus Deploy

```bash
curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health
# Should return: {"ok":true,"commitSha":"<sha>","db":"ok",...}
```

Wait until `commitSha` matches the latest commit before running tests.

---

## Key Files

### Hephaestus

| File | Purpose |
|------|---------|
| `frontend/lib/application-db.ts` | All DB operations + DDL schema init (schemaReady, getStageSchemaReady, columnExistsInTable) |
| `frontend/lib/application-store.ts` | Business logic layer (loginPreview, getSessionUser, etc.) |
| `frontend/app/me/page.tsx` | Redirect to /me/hr if hrBinaryRole, else /me/application |
| `frontend/app/api/admin/bootstrap/route.ts` | Sets hr_binary_role=true for a given email |
| `frontend/components/hr-stage-controls.tsx` | HR stage/status selects + orderedStageIds |
| `frontend/app/me/hr/page.tsx` | HR dashboard page |
| `e2e/hr-stage-lifecycle.spec.ts` | HR stage lifecycle E2E tests |
| `e2e/hr-status-filter.spec.ts` | HR status filter E2E test |
| `test_assets/test_users.json` | Test credentials (baseUrl must point to AWS URL) |
| `CLAUDE.md` | Project rules and workflow |
| `ARCHITECTURE.md` | System architecture, status system, stage mappings |

### Chronos

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Drizzle ORM schema for flolabs_users and all Chronos tables |
| `src/lib/auth.ts` | NextAuth v5 credentials auth |
| `e2e/` | Playwright E2E tests (all passing) |
| `GAME_MASTER.md` | Current implementation status and next steps |
| `CLAUDE.md` | Project rules and workflow |

---

## Known Gotchas

1. **DDL locking**: `ALTER TABLE` acquires ACCESS EXCLUSIVE lock. ALWAYS check `information_schema.columns` first. Pattern established in `columnExistsInTable()` in `application-db.ts:97`.
2. **NextAuth session**: `page.context().clearCookies()` does NOT reliably clear NextAuth sessions. Use `page.context().browser()!.newContext()` for isolation in multi-account tests.
3. **Playwright strict mode**: `getByText(...)` can match multiple elements. Use `.first()` or more specific locators.
4. **Login form hydration**: Always `waitUntil: 'load'` then `waitFor({ state: 'visible' })` before filling inputs in the Hephaestus login form (React controlled component with default values).
5. **hr_binary_role**: This column controls HR dashboard access in Hephaestus. It must be `true` for the HR test user. The bootstrap API sets it, but data may reset if a fresh DB state is applied.
6. **CRON_SECRET**: `6IXvIoMfk8MCMOvWzBPAWgnlwl0T6gAPaAxpYMtO8xkA` — used for bootstrap and cron auth.
7. **App Runner cold start**: First request after cold start runs the schema fast-path check (one read-only DB query). Should be <1s now with the fix.

---

## Next Actions (priority order)

1. Wait for `6f74491` to deploy to Hephaestus App Runner (monitor via health API)
2. Run `bootstrap` curl to set `hr_binary_role = true` for `zoom@flomadlabs.com`
3. Run the HR E2E test suite and confirm all 7 tests pass
4. If tests pass: task complete — shared DB implementation is fully validated end-to-end
5. If tests fail: check test output carefully, fix the specific failure, repeat

---

## Repo Locations

- Hephaestus: `C:\Users\olire\Documents\workspace_python\hephaestus-international`
- Chronos: `C:\Users\olire\Documents\workspace_python\FloLabs_Chronos`
- AWS CLI: pre-authenticated, region `us-east-1`, account `975049954782`
