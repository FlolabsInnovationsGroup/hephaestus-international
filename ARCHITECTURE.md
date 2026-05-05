# Hermes Applicant Platform (Hephaestus) — Implementation Status

## Goal

Centralize the FloLabs educational-program application flow inside the website platform, replace HubSpot/Sheets/email-thread dependence, and bridge accepted applicants into Chronos.

## Cross-system profile and Chronos (2026-04)

Hephaestus and Chronos share **one logical person record** for people in the program: Chronos persists that record primarily in the **`applicants`** table (with `users` holding sign-in credentials and links such as `chronosUserId`). The website’s applicant object is the **upstream editor** for funnel and profile fields; Chronos is the **downstream system of record** for time tracking, HR directory, and Notion-side automation once sync has run.

- **Website profile surface**: `/profile` uses `ProfileEditor`, which saves through `POST /api/applications/profile`. Profile picture uploads use `POST /api/applications/profile-picture`. Email is displayed but not edited on that form (identity changes are operational).
- **Sync entry point**: `frontend/lib/chronos-sync.ts` — `syncApplicantToChronos(applicant)` merges a snapshot into a local file `data/chronos-sync.json` (preview / audit trail) and, when configured, `POST`s JSON to `CHRONOS_SYNC_API_URL` with optional `Authorization: Bearer <CHRONOS_SYNC_TOKEN>`.
- **Outbound payload (conceptual)**: external id, email, name parts, phone, location, LinkedIn, role applied for, **stage**, **status**, joined/visit timestamps, source, and a boolean hint `syncedToTeamMembers` derived from stage (`agreement_signed`, `chronos_synced`, or `joined`). Chronos maps this into applicant rows and downstream jobs (Team Members / MasterClasses behavior is owned on the Chronos side).
- **Directory parity**: After sync and linking, Chronos’s Users experience overlays **applicant** fields on Chronos users for people in program scope (typically `stage = joined` or `status in (joined, active)`). Hephaestus does not render that directory; operators use Chronos for the live team list and timers.
- **Notion**: Team Member page association and MasterClasses creation are triggered from Chronos when rules are satisfied; Hephaestus only supplies the applicant lifecycle signals via sync.

## Current Implemented State

### Website / Applicant Platform
- Internal application form replaces HubSpot on internship pages
- Role is auto-filled from internship page
- Applicant login flow exists
- `/me/application` exists with:
  - left-side chat
  - right-side stage content
  - timeline view
- `/me/hr` exists with:
  - lead list
  - search/filter
  - conversation access
  - stage/status controls
- `/profile` exists and supports backend profile updates (aligned intent with Chronos applicant profile after sync)
- `STEPS.json` is the Git-managed stage content source
- File-backed preview persistence exists in `frontend/data/`
- Chronos sync contract is implemented in `frontend/lib/chronos-sync.ts`
- Free map picker uses OpenStreetMap/Leaflet in `frontend/components/location-picker.tsx`

### Applicant Backend
- Application creation API
- Applicant message API
- Profile update API
- Admin lead listing API
- Admin stage/status mutation API
- Stage updates can trigger Chronos sync payload generation
- Applicant chat can use OpenAI when `OPENAI_API_KEY` is set, otherwise falls back to rule-based Paula replies

### Chronos Integration

- Chronos maintains an **`applicants`** model aligned with program profile data (and links applicants to **`users`** for authentication and the Users directory).
- Chronos exposes applicant-oriented HTTP APIs (for example `/api/applicants`) consumed by automation and admin flows.
- Website preview and production can target Chronos using:
  - `CHRONOS_SYNC_API_URL`
  - `CHRONOS_SYNC_TOKEN`
- HR or automation code paths that call `syncApplicantToChronos` should run whenever stage/status changes must be visible in Chronos (joined pipeline, access, Notion follow-ups).

## Production Deployment

- **Runtime:** AWS App Runner (`us-east-1`) — deployed via GitHub Actions (`.github/workflows/deploy-aws-apprunner.yml`)
- **Service URL:** `fykgssqbvg.us-east-1.awsapprunner.com`
- **Database:** shared AWS RDS PostgreSQL with Chronos — connected via `CHRONOS_DB_DATABASE_URL` / `FL_CHRONOS_DATABASE_URL`
- **Instance:** 1 vCPU / 2 GB (same infrastructure account as Chronos)

Deploy path: `git push origin main` → GitHub Actions → ECR → App Runner (same OIDC/ECR pattern as Chronos).

## Known Gaps / Remaining Work
- Real CV file upload/storage (API stubs may exist; end-to-end storage story incomplete)
- Fully live Paula integration using the exact Emails_automation stack
- Full funnel parity with every branch/reminder state from `FUNNEL.md`

## Build Notes
- Website build succeeds but still logs missing `CONTENT_STRAPI_URL` warnings for content-backed pages when that env var is absent
- `@neondatabase/serverless` remains in `package.json` as a legacy dependency but is not used; the app connects to AWS RDS via the `postgres` driver

## Recommended Next Steps
1. Remove or replace the `@neondatabase/serverless` dependency (it is unused; the app uses the `postgres` driver against AWS RDS)
2. Wire Paula to the existing Emails_automation backend and prompts
3. Add real CV upload/storage
