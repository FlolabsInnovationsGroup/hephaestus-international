# Hephaestus Applicant Platform — Architecture

## Production URLs (agent entry point)

| | URL |
|---|---|
| **Production domain** | `https://efestos.international` |
| **Health check** | `GET https://efestos.international/api/health` |

---

## System Architecture (for agents)

Read this section first for **where code runs**, **what stores state**, and **how deploys work**.

| Concern | Implementation |
|---|---|
| **App server** | **Next.js 16** (App Router) in `frontend/` directory. Docker image on **EC2** (`i-0292b7ec02f26a25b`, `44.195.108.173`) via Docker Compose at `/opt/hosting`. Nginx reverse-proxies port 3001 → container port 3000. |
| **Images & deploy** | ECR repository `hephaestus-international`. **AWS CodeBuild** (`hephaestus-international-deploy`) builds and pushes `git-<sha>` + `:latest` tags. EC2 pulls `:latest` via `docker compose pull && docker compose up -d hephaestus`. |
| **Database** | Shared **AWS RDS PostgreSQL 16** with FloLabs Chronos (`flolabs-db.ccxceiswgkrj.us-east-1.rds.amazonaws.com/neondb`). URL in SSM `/flolabs-chronos/DATABASE_URL`. Migrated from Neon 2026-06-01. **Canonical identity** is the **`flolabs_users`** table; Chronos and Hephaestus read/write the same rows for profiles, pipeline fields, and (where applicable) credentials. |
| **Auth** | Cookie-based session (`fl_preview_session`). `canAccessSharedFloLabsAccount()` in `frontend/lib/application-store.ts` gates login — blocks `rejected` only; all other statuses allowed. |
| **AI chatbot** | Paula uses OpenAI when `OPENAI_API_KEY` is set; falls back to rule-based replies when absent. |
| **Location picker** | OpenStreetMap / Leaflet (`frontend/components/location-picker.tsx`) |
| **Email** | Resend — shared SSM params `/flolabs-chronos/RESEND_API_KEY` and `/flolabs-chronos/EMAIL_FROM` |
| **CMS (optional)** | Strapi (`CONTENT_STRAPI_URL`) for marketing pages. App works without it; missing env var logs a build warning. |
| **Chronos sync** | `frontend/lib/chronos-sync.ts` — `syncApplicantToChronos()` pushes profile/stage/status to Chronos. `revokeChronosAccess()` runs when status becomes **`graduated`** or **`terminated`**; `grantChronosAccess()` when status becomes **`joined`**. |
| **Applicant status** | Shared column **`flolabs_users.status`** (`frontend/lib/applicant-status.ts`, mirrored in Chronos `src/lib/applicant-status.ts`). HR edit modal includes all pipeline values including **`graduated`** and **`terminated`**. |
| **Permanent delete** | `POST /api/admin/leads/delete` → `deleteApplicantPermanently()` archives the Notion Team Member page and removes related DB rows. UI confirmation warns to use Terminate/Graduate instead when appropriate. |
| **NEXTAUTH_URL** | Set to `https://efestos.international` in the EC2 env file (`/opt/hosting/hephaestus.env`). |

### AWS Resources

| Resource | Value |
|---|---|
| EC2 instance | `i-0292b7ec02f26a25b` (`44.195.108.173`, `us-east-1`) |
| EC2 IAM profile | `flolabs-hosting-ec2-profile` |
| Docker Compose dir | `/opt/hosting/docker-compose.yml` on the EC2 |
| ECR repository | `hephaestus-international` (`975049954782.dkr.ecr.us-east-1.amazonaws.com/hephaestus-international`) |
| CodeBuild project | `hephaestus-international-deploy` |
| Region / Account | `us-east-1` / `975049954782` |

### Runtime Secrets

Baked into the Docker image at build time from **AWS SSM** (CodeBuild `pre_build`):
- `/flolabs-chronos/DATABASE_URL` — shared RDS PostgreSQL (`neondb` database on `flolabs-db`)
- `/hephaestus-international/CHRONOS_SYNC_API_URL`, `CHRONOS_SYNC_TOKEN`
- `/hephaestus-international/CONTENT_STRAPI_URL`, `STRAPI_API_TOKEN`, `CONTENT_STRAPI_API_TOKEN`
- `/flolabs-chronos/RESEND_API_KEY`, `EMAIL_FROM`, `NOTION_API_KEY`, `CRON_SECRET`, `OPENAI_API_KEY`

Runtime env file on EC2: `/opt/hosting/hephaestus.env` (pulled from `s3://flolabs-chronos-backups/hosting-ec2/hephaestus.env`).

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
| `graduated` | Completed program; Chronos access revoked | ✅ | ❌ (`is_active = false`) |
| `terminated` | Left program; Chronos access revoked | ✅ | ❌ (`is_active = false`) |

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

Hephaestus and Chronos share **one AWS RDS PostgreSQL 16 database** (`flolabs-db`, `neondb` database) and connect with identical credentials. Migrated from Neon 2026-06-01.

**Hephaestus-managed table:** **`flolabs_users`** — created/altered by `ensurePostgresSchema()` in `frontend/lib/application-db.ts`.

**Data flow:** Hephaestus HR UI and applicant flows read/write **`flolabs_users`**. Chronos uses the same table via Drizzle (`users` → physical `flolabs_users`). Optional HTTP sync to Chronos (`CHRONOS_SYNC_API_URL`) remains for API-level integration tests; profile changes do not depend on a second table for correctness.

**Chronos tables read/written by Hephaestus (shared DB):**
- **`flolabs_users`** — primary read/write for HR profile, pipeline stage/status, passwords (applicant flows), and `is_active` updates from `revokeChronosAccess()` / merge.
- **`time_entries`**, **`tags`**, **`user_email_aliases`**, **`applicant_duplicate_reviews`** — merge and access flows update these where needed; FKs target **`flolabs_users.id`**.

### Merge contract (unified)

When HR merges duplicate leads via `POST /api/admin/leads/merge`:

1. **`flolabs_users` (canonical)** — merged profile fields written to the canonical row (`email`, names, phone, linkedin, city, country, role, education, source, notes).
2. **`flolabs_users` (secondaries)** — `status = 'closed'` and `is_active = false` for merged-away rows (skips `admin` / `hr` roles).
3. **`time_entries`** — `user_id`, `flolabs_id`, and `applicant_id` re-pointed to the canonical **`flolabs_users.id`** where applicable.
4. **`tags`** — ownership consolidated to the canonical user where name conflicts allow; duplicate-name tags on secondaries removed.
5. **`user_email_aliases`** — kept emails registered under the canonical user id.
6. **`applicant_duplicate_reviews`** — audit rows written with `status = 'merged'`.

After a merge, secondary person rows remain in **`flolabs_users`** but are closed/inactive; Chronos and Hephaestus both see the canonical row immediately.

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
- `@neondatabase/serverless` is in `package.json` but the app uses the standard `postgres` npm driver directly (can be removed — legacy from Neon migration)
