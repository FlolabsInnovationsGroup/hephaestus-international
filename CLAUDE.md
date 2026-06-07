# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# CLAUDE.md — Hephaestus

Project context for coding agents working in this repository.

## Read Order

1. `ARCHITECTURE.md` — production URLs, system architecture, 8-status system, stage mapping, key files
2. `DEPLOYMENT.md` — how production gets to AWS (CodeBuild, ECR, App Runner)
3. `QA_CHECKLIST.md` — HR pipeline test cases and Playwright execution commands
4. This file — workflow rules and coding guardrails
5. Read actual source files in `frontend/` before changing behavior

## Workflow

- **Deploy and verify on every task.** After any code change: commit, `git push origin main`, wait for App Runner to reach RUNNING with the new commitSha, then run the relevant Playwright E2E suite against the live URL and confirm the changed behaviour works in the browser. A task is not done until this passes. If no E2E test covers the changed path, write one first.
- **Default: push after work.** Commit and `git push origin main` after a coherent change, then deploy via AWS CodeBuild (see `DEPLOYMENT.md`).
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
- **Database:** PostgreSQL via `postgres` driver — shared **AWS RDS PostgreSQL 16** with Chronos (`flolabs-db.ccxceiswgkrj.us-east-1.rds.amazonaws.com/neondb`). URL in SSM `/flolabs-chronos/DATABASE_URL` and App Runner env vars (`DATABASE_URL`, `FL_CHRONOS_DATABASE_URL`, `CHRONOS_DB_DATABASE_URL`). Migrated from Neon on 2026-06-01.
- **Auth:** Cookie-based session (`fl_preview_session`); NextAuth secret = `AUTH_SECRET` GitHub secret
- **AI:** OpenAI for Paula chatbot (optional — falls back to rule-based if `OPENAI_API_KEY` absent)
- **Email:** Resend (shared SSM params `/flolabs-chronos/RESEND_API_KEY`, `/flolabs-chronos/EMAIL_FROM`)
- **Deploy:** AWS App Runner via AWS CodeBuild (`hephaestus-international-deploy`) → ECR — see `DEPLOYMENT.md`

## Status System (8 statuses)

```
applying | waiting | signed | joined | approved | rejected | graduated | terminated
```

- `rejected` → cannot log into Hephaestus
- `graduated` → Chronos `users.is_active = false` (auto-revoked on save); Hephaestus login still works. **Owned by Hephaestus HR.**
- `terminated` → Chronos `users.is_active = false` (auto-revoked on save); Hephaestus login still works. **Owned by Hephaestus HR.**
- `joined` → Chronos `users.is_active = true` (granted on save); covers all active Chronos users
- All other statuses → Hephaestus login allowed, no Chronos access change

**Chronos reads `flolabs_users.status` read-only.** `graduated`/`terminated` users cannot sign in to Chronos. Permanent delete is also owned by Hephaestus HR.

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
`ensurePostgresSchema()` in `frontend/lib/application-db.ts` creates/alters **`flolabs_users`**. Write it idempotently — it must not fail if columns already exist. Chronos shares the same RDS database and owns other tables (`time_entries`, `teams`, …) but **not** a separate `users` / `applicants` pair for identity anymore.

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
