# DATA.md — FloLabs User Data Reference

Synthesizes every field stored about users across all tables, maps them to their source, and identifies what is and is not surfaced in the HR dashboard.

---

## Database Overview

Hephaestus and Chronos share one **Neon serverless PostgreSQL** database (`neondb` at `ep-broad-shadow-anqzuaqr.c-6.us-east-1.aws.neon.tech`). Hephaestus owns the DDL for most tables; Chronos owns 2 tables that Hephaestus also reads and writes.

| Table | Owner | Purpose |
|---|---|---|
| `flolabs_users` | Hephaestus | Primary applicant records (all stages) |
| `website_applicant_conversations` | Hephaestus | Paula / HR / applicant chat per lead |
| `website_password_reset_tokens` | Hephaestus | One-time password reset tokens |
| `website_applicant_stage_transitions` | Hephaestus | Audit log: every stage change with timestamp |
| `website_stage_resources` | Hephaestus | Per-stage links/prompts shown to applicants |
| `website_stage_resource_responses` | Hephaestus | Applicants' written answers to stage prompts |
| `website_stage_definitions` | Hephaestus | Editable stage copy (overrides STEPS.json) |
| `applicant_duplicate_reviews` | Hephaestus | Merge/duplicate decisions per applicant pair |
| `user_email_aliases` | Hephaestus | Alternate login emails per Chronos user |
| `applicants` | Chronos | HubSpot-imported contacts; read + written by Hephaestus |
| `users` | Chronos | Active Chronos users; `is_active` gate for timer access |

---

## Fields Stored Per Applicant

### `flolabs_users` — primary table

| Column | Type | How collected | Notes |
|---|---|---|---|
| `id` | uuid | Auto-generated | Primary key |
| `email` | text | Application form | Unique; login credential |
| `password` | text (bcrypt) | Registration / password reset | Hashed; never exposed |
| `role` | text | Set internally | `applicant` / `admin` / `hr` |
| `hr_binary_role` | boolean | Set by admin | Gates HR dashboard access |
| `first_name` | text | Application form | |
| `last_name` | text | Application form | |
| `phone_number` | text | Application form | Single value; multi shown via merge |
| `country` | text | Location picker (OpenStreetMap) | |
| `state_region` | text | Location picker | Rarely filled |
| `city` | text | Location picker | |
| `latitude` | double | Location picker | Raw coordinate; no map in HR |
| `longitude` | double | Location picker | Raw coordinate; no map in HR |
| `linkedin_url` | text | Application form | |
| `education` | text | Application form | Free-text; may hold job title for Chronos imports |
| `source` | text | Application form / Notion DB | Where they heard about FloLabs |
| `referral_name` | text | Application form | Who referred them (optional) |
| `cv_file_name` | text | Application form | Original filename; used for download |
| `cv_url` | text | Application form / upload | URL to file (storage incomplete — see ARCHITECTURE.md) |
| `profile_picture_url` | text | Profile upload | URL to image |
| `role_applied_for` | text | Application form | Internship role |
| `stage` | text | Set by HR | 14 possible values — see ARCHITECTURE.md |
| `status` | text | Set by HR / auto from stage | 8 possible values: `applying` `waiting` `signed` `joined` `approved` `rejected` `graduated` `terminated` |
| `joined_at` | timestamptz | Application submission | Application creation timestamp |
| `last_visited_at` | timestamptz | Login / stage update | Last time applicant touched the platform |
| `notes` | text | HR editable | Free-text HR notes |
| `safe_senders_confirmed` | boolean | Applicant self-reported | Whether they added FloLabs to safe senders |
| `communication_consent` | boolean | Application form | GDPR-style consent flag |
| `created_at` | timestamptz | Auto | Row insertion time |
| `updated_at` | timestamptz | Auto | Last row modification time |
| `low_effort_rollback_after` | timestamptz | Automated | Scheduled time for automatic stage rollback (low-effort path) |
| `low_effort_return_stage` | text | Automated | Stage to return to after rollback |
| `notion_team_member_page_url` | text | HR editable | Link to Chronos team member's Notion page |

### `website_applicant_conversations`

| Column | How collected |
|---|---|
| `applicant_id` | FK to `flolabs_users` |
| `author` | `applicant` / `paula` / `john` / `oliver` |
| `text` | Written in chat by applicant or HR |
| `created_at` | Message send time |

### `website_applicant_stage_transitions`

| Column | How collected |
|---|---|
| `applicant_id` | FK to `flolabs_users` |
| `stage` | Stage value at transition time |
| `reached_at` | Timestamp of the stage change |

### `website_stage_resource_responses`

| Column | How collected |
|---|---|
| `resource_id` | FK to `website_stage_resources` |
| `applicant_id` | Which applicant answered |
| `response_text` | Applicant's free-text answer |
| `submitted_at` | Submission timestamp |

### `applicant_duplicate_reviews`

| Column | How collected |
|---|---|
| `primary_applicant_id` | Detected or chosen canonical record |
| `duplicate_applicant_id` | Suspected duplicate |
| `status` | `pending` / `confirmed_duplicate` / `different_people` / `merged` |
| `confidence_score` | Numeric score computed from shared signals |
| `reasons` | Array: `same phone number`, `same LinkedIn URL`, `same full name`, etc. |
| `reviewed_by_id` | HR user who reviewed (written but not yet read in UI) |
| `reviewed_at` | Review timestamp (written but not yet read in UI) |
| `notes` | HR review notes |

### Chronos `applicants` (read by Hephaestus)

Additional fields that exist on HubSpot-imported contacts not present in `flolabs_users`:

| Column | Notes |
|---|---|
| `current_job_title` | Used as fallback for `education` in the HR view |
| `hubspot_status` | Used as fallback for `notes` in the HR view |
| `hubspot_owner` | Used as fallback for `source` |
| `last_website_visit` | Equivalent of `last_visited_at` |

---

## What the HR Dashboard Shows

### Lead list (left sidebar — every card)

| Data point | Source field |
|---|---|
| Full name | `first_name` + `last_name` |
| Email | `email` |
| Status badge | `status` |
| Role applied for | `role_applied_for` |
| Stage (formatted) | `stage` |
| Joined date | `joined_at` |
| Last visit date | `last_visited_at` |
| City | `city` |

### Lead detail panel (right — selected lead)

| Data point | Source field |
|---|---|
| Status | `status` |
| Stage | `stage` |
| Date joined | `joined_at` |
| Last website visit | `last_visited_at` |
| Emails (all) | `email` + `alternateEmails` (from `user_email_aliases`) |
| Phone numbers | `mergedPhoneNumbers` (primary + merged duplicates) |
| LinkedIn URLs | `mergedLinkedinUrls` |
| Cities | `mergedCities` |
| Countries | `mergedCountries` |
| Source | `source` |
| Education | `education` |
| Notion Team Member page | `notion_team_member_page_url` (link) |
| Duplicate candidates | `duplicateCandidates` with score + reasons |
| CV download | `cv_url` / `cv_file_name` (button; only if URL present) |
| Profile picture download | `profile_picture_url` (button; only if URL present) |

### Filters available to HR

| Filter | Field used |
|---|---|
| Free text search (`q`) | `first_name`, `last_name`, `email`, `role_applied_for`, `source`, `city`, `country`, `education`, `linkedin_url`, `notes` |
| Stage | `stage` |
| Status | `status` |
| Source | `source` |
| Country | `country` |
| City | `city` |
| Joined date range | `joined_at` |
| Last visited range | `last_visited_at` |
| Duplicate review status | `duplicateCandidates[].reviewStatus` |

### Sort options

`joined_desc` (default), `joined_asc`, `visited_desc`, `visited_asc`, `name_asc`, `name_desc`

---

## What Is Stored But NOT Displayed in the HR Dashboard

| Field / Table | Stored where | Missing from HR because |
|---|---|---|
| `state_region` | `flolabs_users` | Not rendered in lead details or filters |
| `latitude` / `longitude` | `flolabs_users` | No map view in HR; raw coords collected but unused |
| `referral_name` | `flolabs_users` | Not rendered anywhere in the dashboard |
| `notes` | `flolabs_users` | Editable via "Edit lead" modal but **not shown** in read-only lead details panel |
| `safe_senders_confirmed` | `flolabs_users` | No indicator in HR; HR can't see if applicant added FloLabs to contacts |
| `communication_consent` | `flolabs_users` | Not surfaced; relevant for GDPR compliance review |
| `low_effort_rollback_after` / `low_effort_return_stage` | `flolabs_users` | Automation-only fields; HR has no visibility into pending rollbacks |
| `created_at` / `updated_at` | `flolabs_users` | Only `joined_at` and `last_visited_at` are shown; internal timestamps hidden |
| `hr_binary_role` | `flolabs_users` | Used for access control; not displayed as a user attribute |
| `password` | `flolabs_users` | Intentionally hidden (hashed) |
| Stage transition history | `website_applicant_stage_transitions` | Full audit log exists but HR has no timeline view of past stages per lead |
| Stage resource responses | `website_stage_resource_responses` | Applicants' written answers to prompts are in DB; `getStageResponsesForHr()` exists but its output is not wired into the HR dashboard UI |
| Duplicate review `reviewed_by_id` / `reviewed_at` | `applicant_duplicate_reviews` | Captured on write but never read back; HR sees no "reviewed by" attribution |
| Duplicate review `notes` | `applicant_duplicate_reviews` | Shown only if the candidate's `reviewNotes` is truthy; the field for entering notes in the review modal is not present |
| HubSpot fields from Chronos (`hubspot_status`, `hubspot_owner`) | `applicants` (Chronos) | Used as fallback values when displaying imported contacts; not shown as distinct fields |
| `current_job_title` from Chronos | `applicants` (Chronos) | Folded into `education` display; no separate label |
| `user_email_aliases.is_primary` | `user_email_aliases` | All aliases shown in a merged list; no indicator of which is primary |
| `website_password_reset_tokens` | reset token table | Security / lifecycle data; not relevant to HR |
| Conversation authors `john` / `oliver` | `website_applicant_conversations` | Chat is shown; named authors displayed, but no HR-specific message filtering |

---

## Data Quality Notes

- **CV upload is incomplete.** `cv_file_name` and `cv_url` are stored when the applicant submits a file, but end-to-end storage (S3/object store) is not wired up in production. The download button appears only if `cv_url` is non-empty.
- **Coordinates without a map.** Latitude/longitude are collected via the OpenStreetMap location picker but the HR dashboard has no map or proximity-based filter.
- **`notes` invisible in read mode.** HR can write notes on a lead (via "Edit lead"), but the notes field is not rendered in the read-only details panel, so there is no way to see notes without opening the edit modal.
- **Stage history exists but is invisible.** Every stage change is recorded in `website_applicant_stage_transitions` with a timestamp. There is no HR view to see how long a candidate spent at each stage or when they moved.
- **Applicant responses are collected but not shown to HR.** Written answers to stage prompts (`website_stage_resource_responses`) have a backend query (`getStageResponsesForHr()`), but the result is not rendered anywhere in the HR dashboard.
- **Referral tracking is collected but hidden.** `referral_name` is stored at application time but never shown to HR.
- **GDPR fields are opaque.** `safe_senders_confirmed` and `communication_consent` are boolean flags collected during onboarding, but HR has no way to filter or view them.
