# Hephaestus Applicant Platform — Architecture

## Production URLs (agent entry point)

| | URL |
|---|---|
| **Production domain** | `https://efestos.international` |
| **AWS App Runner URL** | `https://fykgssqbvg.us-east-1.awsapprunner.com` |
| **Health check** | `GET https://fykgssqbvg.us-east-1.awsapprunner.com/api/health` |

---

## System Architecture (for agents)

Read this section first for **where code runs**, **what stores state**, and **how deploys work**.

| Concern | Implementation |
|---|---|
| **App server** | **Next.js 16** (App Router) in `frontend/` directory. Docker image on **AWS App Runner** (`us-east-1`). Handles SSR, route handlers (`frontend/app/api/**`), and Server Components. |
| **Images & deploy** | Immutable ECR tags `git-<12-char-sha>`. **GitHub Actions** (`.github/workflows/deploy-aws-apprunner.yml`) builds on push to `main` or manual `workflow_dispatch`, updates App Runner, verifies `/api/health` returns matching commit SHA. |
| **Database** | Shared **AWS RDS PostgreSQL** with FloLabs Chronos. All three env aliases point to the same SSM param `/flolabs-chronos/DATABASE_URL`: `DATABASE_URL`, `CHRONOS_DB_DATABASE_URL`, `FL_CHRONOS_DATABASE_URL`. Hephaestus owns `website_applicants`; Chronos owns `applicants` and `users` in the same DB. |
| **Auth** | Cookie-based session (`fl_preview_session`). `canAccessSharedFloLabsAccount()` in `frontend/lib/application-store.ts` gates login — blocks `rejected` only; all other statuses allowed. |
| **AI chatbot** | Paula uses OpenAI when `OPENAI_API_KEY` is set; falls back to rule-based replies when absent. |
| **Location picker** | OpenStreetMap / Leaflet (`frontend/components/location-picker.tsx`) |
| **Email** | Resend — shared SSM params `/flolabs-chronos/RESEND_API_KEY` and `/flolabs-chronos/EMAIL_FROM` |
| **CMS (optional)** | Strapi (`CONTENT_STRAPI_URL`) for marketing pages. App works without it; missing env var logs a build warning. |
| **Chronos sync** | `frontend/lib/chronos-sync.ts` — `syncApplicantToChronos()` pushes profile/stage/status to Chronos. `revokeChronosAccess()` sets `users.is_active = false` when status becomes `terminated`. |
| **NEXTAUTH_URL** | Set to AWS URL at runtime. Custom domain `efestos.international` is a DNS / App Runner alias pointing to the same service. |

### AWS Resources

| Resource | Value |
|---|---|
| App Runner service | `hephaestus-international` |
| Service ARN | `arn:aws:apprunner:us-east-1:975049954782:service/hephaestus-international/7b3d7cb4f0894c21ae16f15b985fedc7` |
| ECR repository | `hephaestus-international` |
| GitHub Actions role | `arn:aws:iam::975049954782:role/hephaestus-international-github-actions-deploy` |
| App Runner ECR role | `arn:aws:iam::975049954782:role/hephaestus-international-apprunner-ecr-access-role` |
| VPC connector | `arn:aws:apprunner:us-east-1:975049954782:vpcconnector/flolabs-chronos-vpc-connector/1/41208035860d463f92e083af41247fe1` (shared with Chronos) |
| Instance size | 1 vCPU / 2 GB |
| Region / Account | `us-east-1` / `975049954782` |

### Runtime Secrets

Pulled from **AWS SSM** during deploy:
- `/flolabs-chronos/DATABASE_URL` — shared Postgres (RDS)
- `/hephaestus-international/CHRONOS_SYNC_API_URL`
- `/hephaestus-international/CHRONOS_SYNC_TOKEN`
- `/hephaestus-international/CONTENT_STRAPI_URL`
- `/hephaestus-international/STRAPI_API_TOKEN`
- `/hephaestus-international/CONTENT_STRAPI_API_TOKEN`
- `/flolabs-chronos/RESEND_API_KEY` (shared with Chronos)
- `/flolabs-chronos/EMAIL_FROM` (shared with Chronos)

From **GitHub Actions secrets**: `AUTH_SECRET` (→ `NEXTAUTH_SECRET`), `OPENAI_API_KEY`

---

## Applicant Status System

### The 7 Statuses

| Status | Meaning | Hephaestus login | Chronos access |
|---|---|---|---|
| `applying` | Applied; hasn't reached second meeting stage | ✅ | ❌ |
| `waiting` | Passed second meeting; agreement not yet signed | ✅ | ❌ |
| `signed` | Agreement signed; pending Chronos onboarding | ✅ | ❌ |
| `joined` | Onboarded to Chronos (includes actively using timers) | ✅ | ✅ (`is_active = true`) |
| `approved` | Manual HR override | ✅ | ❌ |
| `rejected` | Rejected; all platform access revoked | ❌ | ❌ |
| `terminated` | Chronos access revoked; Hephaestus account preserved | ✅ | ❌ (`is_active = false`) |

### Stage-to-Status Canonical Mapping

When HR selects a stage, the status auto-updates to the canonical value (via `statusForStage()` in `hr-stage-controls.tsx`). HR can override manually before saving.

| Stage # | Stage ID | Canonical Status |
|---|---|---|
| 1 | `application_submitted` | `applying` |
| 2 | `new` | `applying` |
| 3 | `contacted` | `applying` |
| 4 | `interested_review` | `applying` |
| 5 | `before_meeting` | `applying` |
| 6 | `meeting_recordings_submitted` | `applying` |
| 7 | `saturday_meeting` | `applying` |
| 8 | `attended` | `applying` |
| 9 | `masterclass_submitted` | `applying` |
| 10 | `second_meeting` | `waiting` |
| 11 | `agreement_sent` | `waiting` |
| 12 | `agreement_signed` | `signed` |
| 13 | `chronos_synced` | `joined` |
| 14 | `joined` | `joined` |

### Access Control

- **Hephaestus login** (`canAccessSharedFloLabsAccount()` in `application-store.ts`): blocks `rejected` only; all other statuses can log in.
- **Chronos `users.is_active`**: `grantChronosAccess()` sets it to `true` for `joined` status. `revokeChronosAccess()` sets it to `false` for `terminated`.

---

## Key Routes

| Route | Purpose |
|---|---|
| `GET /login` | Applicant / HR login (React controlled form — requires hydration before `.fill()` in tests) |
| `GET /me/application` | Applicant view: left chat + right stage timeline |
| `GET /me/hr` | HR dashboard: lead list, search/filter, stage/status controls |
| `GET /profile` | Profile editor aligned with Chronos applicant profile |
| `POST /api/applications` | Create new application |
| `POST /api/applications/profile` | Update applicant profile |
| `POST /api/applications/profile-picture` | Upload profile picture |
| `GET /api/admin/leads` | List applicants (HR/admin) |
| `POST /api/admin/leads/stage` | Update stage/status; calls `revokeChronosAccess()` for `terminated`, `grantChronosAccess()` + `syncApplicantToChronos()` for `joined` |
| `GET /api/health` | Build metadata; returns `{ ok, commitSha, imageTag, ... }` |

---

## Key Source Files

| File | Purpose |
|---|---|
| `frontend/app/application-data.ts` | `ApplicantStatus` union type, `ApplicantProfile` type |
| `frontend/lib/application-db.ts` | All DB access: schema creation, CRUD, Chronos `users` read, `chronosUserToApplicant()` |
| `frontend/lib/application-store.ts` | Login gate (`canAccessSharedFloLabsAccount()`), session helpers |
| `frontend/lib/chronos-sync.ts` | `syncApplicantToChronos()`, `revokeChronosAccess()` |
| `frontend/components/hr-stage-controls.tsx` | Stage + status selects with `statusForStage()` auto-suggest |
| `frontend/components/login-form.tsx` | Controlled React form with `useState` defaults |
| `frontend/app/me/hr/page.tsx` | HR dashboard; passes `statusOptions` array |
| `frontend/app/api/admin/leads/stage/route.ts` | Stage API; branches on `terminated` for revocation vs sync |
| `STEPS.json` | Git-managed stage content for applicant timeline view |

---

## Database

Hephaestus and Chronos share **one AWS RDS PostgreSQL instance** and connect with identical credentials.

**Hephaestus-managed table:** `website_applicants` — created by `ensurePostgresSchema()` in `application-db.ts`. This is the primary source for the HR pipeline.

**Chronos tables read/written by Hephaestus:**
- `users` — `is_active` written by `revokeChronosAccess()`; read by `chronosUserToApplicant()` to derive applicant status (`is_active = false` → `terminated`, `is_active = true` → `joined`)
- `applicants` — written via `syncApplicantToChronos()` when stage/status changes

**Data flow:** `website_applicants` (Hephaestus source) → Chronos `applicants` (via sync) → Chronos `users` (for active users with timer sessions)

### Merge Sync Contract

When HR merges duplicate leads via `POST /api/admin/leads/merge`, the operation propagates changes across all three tables to keep Chronos in sync:

1. **`website_applicants` (canonical)** — merged profile (email, names, phone, linkedin, city, country, role, education, source) written to the canonical row.
2. **`applicants` (canonical)** — same profile values written to the matching `applicants` row so Chronos reads fresh data.
3. **`applicants` (secondaries)** — `status = 'closed'` set on all secondary rows so they are hidden from Chronos views.
4. **`users` (canonical)** — `email` updated if the primary email changed.
5. **`users` (secondaries)** — `is_active = false` set on secondary rows (skips rows with `role = 'admin'` or `role = 'hr'` to avoid locking out staff accounts).
6. **`time_entries`** — re-pointed to canonical `user_id` / `flolabs_id` / `applicant_id` so history stays intact.
7. **`user_email_aliases`** — all kept emails registered under the canonical user.
8. **`applicant_duplicate_reviews`** — audit record written with `status = 'merged'`.

After a merge, the secondary leads exist in the database but are invisible to Chronos (closed/inactive). The canonical lead shows the combined profile.

---

## Project Layout (relevant paths)

```
hephaestus-international/
├── frontend/                         ← Next.js app (Docker build context)
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/leads/          ← HR lead management APIs
│   │   │   ├── applications/         ← Applicant CRUD APIs
│   │   │   └── health/
│   │   ├── login/
│   │   ├── me/
│   │   │   ├── application/          ← Applicant dashboard
│   │   │   └── hr/                   ← HR dashboard
│   │   └── profile/
│   ├── components/
│   │   ├── hr-stage-controls.tsx     ← Stage/status selects + auto-suggest
│   │   ├── login-form.tsx            ← Controlled React login form
│   │   └── location-picker.tsx
│   ├── lib/
│   │   ├── application-data.ts       ← ApplicantStatus type
│   │   ├── application-db.ts         ← All DB access
│   │   ├── application-store.ts      ← Login gate
│   │   └── chronos-sync.ts           ← Chronos sync + revocation
│   └── data/                         ← File-backed preview/sync state
├── e2e/                              ← Playwright E2E tests
│   ├── hr-status-filter.spec.ts
│   └── hr-stage-lifecycle.spec.ts
├── test_assets/
│   └── test_users.json               ← Test credentials (baseUrl = AWS URL)
├── QA_CHECKLIST.md                   ← HR pipeline test cases
├── STEPS.json                        ← Stage content source
├── ARCHITECTURE.md
├── DEPLOYMENT.md
└── CLAUDE.md
```

---

## Known Gaps

- Real CV file upload/storage: API stubs exist but end-to-end storage is incomplete
- Paula not yet wired to the Emails_automation backend (uses OpenAI direct or rule-based fallback)
- `@neondatabase/serverless` is in `package.json` as an unused legacy dependency — app uses `postgres` driver only
