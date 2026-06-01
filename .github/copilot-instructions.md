# Hephaestus — AI Coding Agent Instructions

## What This Project Is

Hephaestus is FloLabs' **internship applicant tracking platform**, live at `https://efestos.international`. It is an internal operations tool — not a public SaaS. It:
- Captures applications from the marketing website and routes them through a 14-stage HR pipeline
- Gives HR a dashboard to filter leads, set stage/status, and trigger Chronos sync
- Syncs accepted applicants into FloLabs Chronos (the time-tracking system) via a shared PostgreSQL database
- Lets applicants log in and view their application progress

---

## Stack

| Concern | Implementation |
|---|---|
| Framework | Next.js 16 App Router (`frontend/` is the Docker build context) |
| Language | TypeScript |
| Database | Shared **AWS RDS PostgreSQL 16** — same database as FloLabs Chronos (`flolabs-db.ccxceiswgkrj.us-east-1.rds.amazonaws.com/neondb`). URL in SSM `/flolabs-chronos/DATABASE_URL`. Migrated from Neon 2026-06-01. |
| Auth | Cookie-based session (`fl_preview_session`); NextAuth secret = `AUTH_SECRET` |
| Deploy | AWS App Runner via AWS CodeBuild (`hephaestus-international-deploy`) |
| CMS | Strapi (optional, for marketing pages only — app works without it) |
| AI chatbot | OpenAI (Paula); falls back to rule-based if `OPENAI_API_KEY` absent |
| Email | Resend (shared SSM params `/flolabs-chronos/RESEND_API_KEY`, `/flolabs-chronos/EMAIL_FROM`) |

---

## Production URLs

| | |
|---|---|
| Production domain | `https://efestos.international` |
| AWS App Runner URL | `https://fykgssqbvg.us-east-1.awsapprunner.com` |
| Health check | `GET /api/health` — returns `{ ok, commitSha, imageTag, ... }` |

---

## The 8 Applicant Statuses

`ApplicantStatus` is defined in `frontend/app/application-data.ts` and is the single source of truth.

| Status | Hephaestus login | Chronos `is_active` |
|---|---|---|
| `applying` | ✅ | unchanged |
| `waiting` | ✅ | unchanged |
| `signed` | ✅ | unchanged |
| `joined` | ✅ | set to `true` |
| `approved` | ✅ | unchanged |
| `rejected` | ❌ blocked | unchanged |
| `graduated` | ✅ | set to `false` |
| `terminated` | ✅ | set to `false` |

**`active` is not a valid status.** Chronos users with `is_active = true` are displayed as `joined`.

### Stage → Status Auto-Mapping

`statusForStage()` in `frontend/components/hr-stage-controls.tsx`:
- Stages 1–9 (`application_submitted` → `masterclass_submitted`) → `applying`
- Stages 10–11 (`second_meeting`, `agreement_sent`) → `waiting`
- Stage 12 (`agreement_signed`) → `signed`
- Stage 13 (`chronos_synced`) → `joined`
- Stage 14 (`joined`) → `joined`

---

## Key Architecture Patterns

### Adding or changing a status
Update **all five** locations (see `CLAUDE.md` for the checklist).

### Chronos sync
- `POST /api/admin/leads/stage` triggers `grantChronosAccess()` when status becomes `joined`
- It triggers `revokeChronosAccess()` when status becomes `terminated`
- `syncApplicantToChronos()` mirrors profile/stage/status to the `applicants` table
- The Chronos `users` table is read by `chronosUserToApplicant()` to derive status: `is_active = false` → `terminated`, `is_active = true` → `joined`

### Database tables
- **`flolabs_users`** — Hephaestus-owned DDL; primary identity table for all applicants. Created/altered by `ensurePostgresSchema()` in `application-db.ts`. Chronos maps its `users` Drizzle model to this physical table.
- `applicants` — Chronos-owned; written by `syncApplicantToChronos()` for HubSpot-imported contacts
- Chronos `is_active` on `flolabs_users` is written by `revokeChronosAccess()` / `grantChronosAccess()`

**Cross-system ownership rule:** Hephaestus owns `graduated`, `terminated`, and permanent delete. Chronos reads `flolabs_users.status` read-only. `graduated`/`terminated` users cannot sign in to Chronos.

### React form hydration
`LoginForm` uses `useState` — it's a controlled component. In Playwright tests, always use:
```typescript
await page.goto('/login', { waitUntil: 'load' });
await page.locator('input').first().waitFor({ state: 'visible' });
await page.locator('input').first().fill(email);
```

---

## Key Source Files

| File | Purpose |
|---|---|
| `frontend/app/application-data.ts` | `ApplicantStatus` union type (source of truth), `ApplicantProfile` interface |
| `frontend/lib/application-db.ts` | All DB access: schema creation, CRUD, `chronosUserToApplicant()` |
| `frontend/lib/application-store.ts` | Login gate (`canAccessSharedFloLabsAccount()`), session helpers |
| `frontend/lib/chronos-sync.ts` | `syncApplicantToChronos()`, `revokeChronosAccess()`, `grantChronosAccess()` |
| `frontend/components/hr-stage-controls.tsx` | Stage + status selects, `statusForStage()` |
| `frontend/components/hr-dashboard-workspace.tsx` | HR lead list + detail panels (client component) |
| `frontend/app/me/hr/page.tsx` | HR dashboard server page |
| `frontend/app/api/admin/leads/stage/route.ts` | Stage/status save API — branches on terminated/joined |
| `frontend/lib/stage-definitions.ts` | `orderedStageIds`, `formatStageLabel()`, `getStageOrder()` |
| `.github/workflows/deploy-aws-apprunner.yml` | CI/CD pipeline |
| `test_assets/test_users.json` | Playwright test credentials (HR + applicant) |

---

## Development Workflow

```bash
# Type check before pushing
cd frontend && npx tsc --noEmit

# Run Playwright E2E tests
cd hephaestus-international
npx playwright test e2e/hr-status-filter.spec.ts e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts

# Verify production after deploy
curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health
```

**Default workflow:** commit → `git push origin main` → GitHub Actions builds Docker image → pushes to ECR → updates App Runner → verifies `/api/health` SHA matches.

---

## Runtime Secrets (AWS SSM)

All production secrets are stored in SSM and fetched during deploy:

| SSM Parameter | Use |
|---|---|
| `/flolabs-chronos/DATABASE_URL` | Shared PostgreSQL (primary DB) |
| `/hephaestus-international/CHRONOS_SYNC_API_URL` | Chronos sync endpoint |
| `/hephaestus-international/CHRONOS_SYNC_TOKEN` | Chronos sync auth token |
| `/hephaestus-international/CONTENT_STRAPI_URL` | Optional Strapi CMS URL |
| `/hephaestus-international/STRAPI_API_TOKEN` | Strapi read token |
| `/hephaestus-international/CONTENT_STRAPI_API_TOKEN` | Strapi write token |
| `/flolabs-chronos/RESEND_API_KEY` | Email sending |
| `/flolabs-chronos/EMAIL_FROM` | Sender address |

GitHub Actions secrets: `AUTH_SECRET` (→ `NEXTAUTH_SECRET`), `OPENAI_API_KEY`.

**IAM note:** The role `hephaestus-international-github-actions-deploy` inline policy `github-actions-hephaestus-deploy` must include every SSM ARN above in its `ssm:GetParameter` resource list.

---

## Read Next

- `ARCHITECTURE.md` — Full system architecture and status/stage tables
- `DEPLOYMENT.md` — CI/CD pipeline details and validation commands
- `CLAUDE.md` — Coding rules and common task checklists
- `QA_CHECKLIST.md` — HR pipeline test cases and Playwright commands
