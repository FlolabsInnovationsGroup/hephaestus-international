# Hephaestus — Developer Guide

## What This Is

Hephaestus is FloLabs' **internship applicant tracking platform**, deployed at `https://efestos.international`. It is an internal operations tool — not a public-facing website.

**Core functions:**
- Captures internship applications and routes them through a 14-stage HR pipeline
- Provides HR with a dashboard to manage leads, set stage/status, and trigger Chronos sync
- Syncs accepted applicants into FloLabs Chronos (time-tracking) via a shared PostgreSQL database
- Allows applicants to log in and view their application progress

**Read first:** `ARCHITECTURE.md` covers the full system, status/stage tables, and key file inventory. `DEPLOYMENT.md` covers the CI/CD pipeline. `CLAUDE.md` covers coding rules and common task checklists.

---

## Stack

| Concern | Implementation |
|---|---|
| Framework | Next.js 16 App Router (`frontend/` is the Docker build context) |
| Language | TypeScript |
| Database | Shared **Neon serverless PostgreSQL** — same database as FloLabs Chronos (`ep-broad-shadow-anqzuaqr.c-6.us-east-1.aws.neon.tech/neondb`). URL in SSM `/flolabs-chronos/DATABASE_URL`. |
| Auth | Cookie-based session (`fl_preview_session`); NextAuth secret = `AUTH_SECRET` |
| Deploy | AWS App Runner via GitHub Actions on push to `main` |
| CMS | Strapi (optional — for marketing pages only; app works without it) |
| AI chatbot | OpenAI (Paula); falls back to rule-based if `OPENAI_API_KEY` absent |
| Email | Resend (shared SSM params `/flolabs-chronos/RESEND_API_KEY`, `/flolabs-chronos/EMAIL_FROM`) |

---

## Project Structure

```
hephaestus-international/
├── frontend/                         ← Next.js app (Docker build context)
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/leads/          ← HR lead management APIs
│   │   │   ├── applications/         ← Applicant CRUD APIs
│   │   │   └── health/               ← Build metadata endpoint
│   │   ├── login/
│   │   ├── me/
│   │   │   ├── application/          ← Applicant dashboard
│   │   │   └── hr/                   ← HR dashboard
│   │   └── profile/
│   ├── components/
│   │   ├── hr-stage-controls.tsx     ← Stage/status selects + auto-suggest
│   │   ├── hr-dashboard-workspace.tsx← HR lead list + detail panels
│   │   └── login-form.tsx            ← Controlled React login form
│   ├── lib/
│   │   ├── application-data.ts       ← ApplicantStatus type (source of truth)
│   │   ├── application-db.ts         ← All DB access
│   │   ├── application-store.ts      ← Login gate
│   │   └── chronos-sync.ts           ← Chronos sync + revocation
│   └── data/                         ← File-backed preview/sync state
├── e2e/                              ← Playwright E2E tests
│   ├── hr-status-filter.spec.ts
│   └── hr-stage-lifecycle.spec.ts
├── test_assets/
│   └── test_users.json               ← Test credentials (HR + applicant)
├── strapi/                           ← Optional marketing CMS (see strapi/README.md)
├── scripts/                          ← Historical one-time migration scripts
├── ARCHITECTURE.md                   ← Full system architecture
├── DEPLOYMENT.md                     ← CI/CD pipeline and validation
├── CLAUDE.md                         ← Coding rules and checklists
└── QA_CHECKLIST.md                   ← HR pipeline test cases
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

---

## Development Workflow

### Type Check

Always run before pushing:

```bash
cd frontend
npx tsc --noEmit
```

### Run Playwright E2E Tests

Tests run against the live AWS URL. Credentials are in `test_assets/test_users.json`.

```bash
# Run all HR tests
npx playwright test e2e/hr-status-filter.spec.ts e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts

# Run a single suite
npx playwright test e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts
```

### Validate Production After Deploy

```bash
curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health
# Returns: { "ok": true, "commitSha": "<sha>", ... }
```

### Deploy

Push to `main` — GitHub Actions builds, pushes to ECR, and updates App Runner:

```bash
git push origin main
```

See `DEPLOYMENT.md` for the full pipeline and verification commands.

---

## Status System

`ApplicantStatus` in `frontend/app/application-data.ts` is the **single source of truth**.

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

When adding or changing a status, update all five locations listed in `CLAUDE.md`.

---

## Database

Hephaestus and Chronos share one **Neon serverless PostgreSQL** database (`neondb`). The old AWS RDS instance was decommissioned in 2026-05.

- **`flolabs_users`** — Hephaestus-owned DDL; primary identity table for all applicants. Managed by `ensurePostgresSchema()` in `application-db.ts`. Chronos reads this table via Drizzle ORM (maps `users` → physical `flolabs_users`).
- **`applicants`** — Chronos-owned; written by `syncApplicantToChronos()` for HubSpot-imported contacts
- Chronos `is_active` on `flolabs_users` is written by `revokeChronosAccess()` / `grantChronosAccess()`

**Cross-system ownership:**
- Hephaestus **owns** `graduated`, `terminated`, and permanent delete of users
- Chronos displays `flolabs_users.status` read-only
- `graduated`/`terminated` users cannot sign in to Chronos

Connection string sourced from `/flolabs-chronos/DATABASE_URL` SSM at deploy time.

---

## Auth

`LoginForm` in `frontend/components/login-form.tsx` is a **controlled React component** using `useState`. In Playwright tests, always wait for hydration before filling:

```typescript
await page.goto('/login', { waitUntil: 'load' });
await page.locator('input').first().waitFor({ state: 'visible' });
await page.locator('input').first().fill(email);
```

`canAccessSharedFloLabsAccount()` in `application-store.ts` gates login — blocks `rejected` only; all other statuses can log in.

---

## Chronos Integration

- `grantChronosAccess()` — sets `users.is_active = true` when status becomes `joined`
- `revokeChronosAccess()` — sets `users.is_active = false` when status becomes `terminated`
- `syncApplicantToChronos()` — pushes profile/stage/status to the Chronos `applicants` table
- `chronosUserToApplicant()` — reads `users.is_active` to derive status: `false` → `terminated`, `true` → `joined`

These are triggered by `POST /api/admin/leads/stage`.

---

## Strapi CMS (Optional)

Strapi is used **only for public marketing pages**. The HR platform works entirely without it. If `CONTENT_STRAPI_URL` is not set, a build warning is logged and everything else runs normally.

See `strapi/README.md` and `CMS_USER_GUIDE.md` for Strapi-specific details.

---

## Troubleshooting

### Type errors after a status/stage change
Run `npx tsc --noEmit` from `frontend/`. Status changes require updates in 5 places — see `CLAUDE.md`.

### CI/CD deploy failures
Check GitHub Actions logs. Most common cause: missing SSM ARN in the IAM inline policy `github-actions-hephaestus-deploy`. Add the missing ARN to the `ReadSharedRuntimeSecrets` statement. See `DEPLOYMENT.md` for the IAM note.

### App Runner not serving new image
Use `aws apprunner describe-service` to check the running image tag vs the expected `git-<sha>`. See `DEPLOYMENT.md`.

### Login form submitting wrong values in Playwright
React hydration issue. Use `waitUntil: 'load'` and `waitFor({ state: 'visible' })` before `.fill()`. See `ARCHITECTURE.md`.
