# CLAUDE.md — Hephaestus

Project context for coding agents working in this repository.

## Read Order

1. `ARCHITECTURE.md` — production URLs, system architecture, 8-status system, stage mapping, key files
2. `DEPLOYMENT.md` — how production gets to AWS (GitHub Actions, SSM, App Runner)
3. `QA_CHECKLIST.md` — HR pipeline test cases and Playwright execution commands
4. This file — workflow rules and coding guardrails
5. Read actual source files in `frontend/` before changing behavior

## Workflow

- **Deploy and verify on every task.** After any code change: commit, `git push origin main`, wait for App Runner to reach RUNNING with the new commitSha, then run the relevant Playwright E2E suite against the live URL and confirm the changed behaviour works in the browser. A task is not done until this passes. If no E2E test covers the changed path, write one first.
- **Default: push after work.** Commit and `git push origin main` after a coherent change to trigger the CI/CD pipeline.
- **Production validation:** test only on the live AWS surface (`https://fykgssqbvg.us-east-1.awsapprunner.com`). Do not use the local dev server as deployment proof.
- **Playwright E2E:** use the MCP Playwright browser tool (preferred for interactive debugging) or `npx playwright test` for running specs. Test credentials live in `test_assets/test_users.json`. The `baseUrl` in that file must always point to the AWS URL.
- **TypeScript:** run `npx tsc --noEmit` from `frontend/` before pushing to catch type errors.

## What This App Is

Hephaestus is FloLabs' internship applicant platform (`https://efestos.international`). It:
- Captures internship applications from the website and tracks them through 14 HR stages
- Provides HR with a dashboard to manage leads, filter by status, and set stage/status
- Syncs accepted applicants into FloLabs Chronos (the time-tracking system) via shared PostgreSQL
- Allows applicants to log in and view their application progress

This is not a public SaaS. It is an internal FloLabs operations tool.

## Stack

- **Framework:** Next.js 16 App Router — `frontend/` directory is the Docker build context
- **Language:** TypeScript
- **Database:** PostgreSQL via `postgres` driver — shared AWS RDS with Chronos (identical credentials)
- **Auth:** Cookie-based session (`fl_preview_session`); NextAuth secret = `AUTH_SECRET` GitHub secret
- **AI:** OpenAI for Paula chatbot (optional — falls back to rule-based if `OPENAI_API_KEY` absent)
- **Email:** Resend (shared SSM params `/flolabs-chronos/RESEND_API_KEY`, `/flolabs-chronos/EMAIL_FROM`)
- **Deploy:** AWS App Runner via GitHub Actions — see `DEPLOYMENT.md`

## Status System (7 statuses)

```
applying | waiting | signed | joined | approved | rejected | terminated
```

- `rejected` → cannot log into Hephaestus
- `terminated` → Chronos `users.is_active = false` (auto-revoked on save); Hephaestus login still works
- `joined` → Chronos `users.is_active = true` (granted on save); covers all active Chronos users
- All other statuses → Hephaestus login allowed, no Chronos access change

See `ARCHITECTURE.md` for the full stage-to-status mapping table and access control rules.

## Coding Rules

### ApplicantStatus type is the source of truth
The canonical status union is in `frontend/app/application-data.ts`. When adding a new status, update **all** of these:
1. `ApplicantStatus` type in `application-data.ts`
2. `statusOptions` array in `frontend/components/hr-stage-controls.tsx`
3. `statusOptions` array in `frontend/app/me/hr/page.tsx`
4. Status mapping blocks in `frontend/lib/application-db.ts`
5. `QA_CHECKLIST.md` status definitions and test cases

### React form inputs require hydration before Playwright can fill them
`LoginForm` uses `useState` with default values — it is a controlled React component. In tests, always use:
```typescript
await page.goto('/login', { waitUntil: 'load' });
await page.locator('input').first().waitFor({ state: 'visible' });
await page.locator('input').first().fill(email);
```
Using `domcontentloaded` or native DOM setters before hydration causes the form to submit with its placeholder default values.

### `terminated` status must call `revokeChronosAccess()`, not `syncApplicantToChronos()`
This branching is in `POST /api/admin/leads/stage`. The Chronos `users.is_active` flag is what actually gates Chronos login — sync alone does not revoke access.

### Database schema changes
`ensurePostgresSchema()` in `frontend/lib/application-db.ts` creates/alters **`flolabs_users`**. Write it idempotently — it must not fail if columns already exist. Chronos shares the same RDS instance and owns other tables (`time_entries`, `teams`, …) but **not** a separate `users` / `applicants` pair for identity anymore.

## Common Tasks

### Add or change a stage
1. Update `orderedStageIds` in `frontend/components/hr-stage-controls.tsx`
2. Update `statusForStage()` in the same file
3. Update `STAGE_STATUS_MAP` in `e2e/hr-stage-lifecycle.spec.ts`
4. Update `QA_CHECKLIST.md`

### Add or change a status
Follow the "ApplicantStatus type is the source of truth" rule above — update all 5 locations.

### Add a protected HR route
1. Gate with HR role check (same pattern as existing routes in `frontend/app/api/admin/`)
2. Test with HR credentials from `test_assets/test_users.json`

### Run Playwright tests
```bash
cd hephaestus-international
npx playwright test e2e/hr-status-filter.spec.ts e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts
# Or a single file:
npx playwright test e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts
```

### Validate a deploy
```bash
curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health
# Should return: { "ok": true, "commitSha": "<sha>", ... }
```

## Access Context

- **Production domain:** `https://efestos.international`
- **AWS URL:** `https://fykgssqbvg.us-east-1.awsapprunner.com`
- **Test HR credentials:** `test_assets/test_users.json` (role: `"Human Resources"`)
- **AWS CLI:** pre-authenticated in this environment; region `us-east-1`, account `975049954782`
- **Repo root:** `C:\Users\olire\Documents\workspace_python\hephaestus-international`
- **Chronos repo:** `C:\Users\olire\Documents\workspace_python\FloLabs_Chronos`
- **Shared DB:** `/flolabs-chronos/DATABASE_URL` SSM parameter
