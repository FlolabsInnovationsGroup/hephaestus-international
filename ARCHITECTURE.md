# Hermes Applicant Platform - Implementation Status

## Goal
Centralize the FloLabs educational-program application flow inside the website platform, replace HubSpot/Sheets/email-thread dependence, and bridge accepted applicants into Chronos.

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
- `/profile` exists and supports backend profile updates
- `STEPS.json` is the Git-managed stage content source
- File-backed preview persistence exists in `frontend/data/`
- Chronos sync contract exists in `frontend/lib/chronos-sync.ts`
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
- Chronos now has an `applicants` model
- Chronos has `/api/applicants`
- Chronos has `/applicants` admin/team-lead page
- Website preview can target Chronos via:
  - `CHRONOS_SYNC_API_URL`
  - `CHRONOS_SYNC_TOKEN`

## Still Missing / Not Production Complete
- Real production DB on website side (current preview uses file-backed persistence)
- Real CV file upload/storage
- Fully live Paula integration using the exact Emails_automation stack
- Verified deployed end-to-end website → Chronos sync in the target environment
- Chronos migration execution in live DB
- Final env setup for Chronos sync token on deployed Chronos
- Full funnel parity with every branch/reminder state from `FUNNEL.md`
- Final production deploy target correction if Vercel linking differs from expected project

## Build Notes
- Website build currently succeeds but still logs missing `CONTENT_STRAPI_URL` warnings for content-backed pages when that env var is absent
- Chronos build succeeds with the applicant API/page additions

## Recommended Next Steps
1. Replace website file-backed persistence with a real DB/auth layer
2. Execute Chronos applicant migration in the real environment
3. Set matching `CHRONOS_SYNC_TOKEN` on deployed Chronos
4. Verify end-to-end sync from website HR stage update into Chronos applicant records
5. Wire Paula to the existing Emails_automation backend and prompts
6. Add real CV upload/storage
