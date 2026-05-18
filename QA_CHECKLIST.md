# QA Checklist — Hephaestus

## How to use this checklist

- **[automated]** items run in CI after every deploy via `npx playwright test`.
- **[manual]** items require a human to spot-check after deploys that touch the related area.
- Spec paths are relative to the repo root.

---

## 1. Authentication

| # | Check | Coverage |
|---|---|---|
| 1.1 | HR login lands on `/me/hr` with status filter visible | **[automated]** `e2e/lib/auth.ts` (`loginAsHr`) — used as `beforeEach` in every HR spec |
| 1.2 | Applicant login lands on `/me/application` | **[automated]** `e2e/role-and-notion-filter.spec.ts` — `loginAsMember` + redirect assertion |
| 1.3 | Applicant is blocked from `/me/hr` and redirected | **[automated]** `e2e/role-and-notion-filter.spec.ts`, `e2e/applicant-dashboard-content.spec.ts` |
| 1.4 | Rejected applicant cannot log in | **[manual]** Set a test account to `rejected`; attempt login; confirm redirect to `/login` |
| 1.5 | Forgot-password UI shows success for any email (anti-enumeration) | **[automated]** `e2e/forgot-password.spec.ts` |
| 1.6 | Forgot-password token is created for a known user | **[automated]** `e2e/forgot-password.spec.ts` |
| 1.7 | Forgot-password API returns 200 for unknown email (no leak) | **[automated]** `e2e/forgot-password.spec.ts` |
| 1.8 | Reset-link email is actually delivered to inbox | **[manual]** After any email code change: request reset for a real address and confirm receipt |

---

## 2. HR Dashboard — Page Load and Content

| # | Check | Coverage |
|---|---|---|
| 2.1 | `/me/hr` loads with "Applicants and conversations" heading | **[automated]** `e2e/hr-dashboard-content.spec.ts`, `e2e/hr-stage-lifecycle.spec.ts` |
| 2.2 | `/me/hr/stages` loads with "Stages" heading | **[automated]** `e2e/nav-pages-smoke.spec.ts`, `e2e/passing-condition-and-content.spec.ts` |
| 2.3 | `/me/hr/settings` loads without error | **[automated]** `e2e/nav-pages-smoke.spec.ts` |
| 2.4 | No "Something went wrong" or "Application error" on any HR page | **[automated]** `e2e/nav-pages-smoke.spec.ts` |
| 2.5 | No uncaught JavaScript exceptions on HR dashboard load | **[automated]** `e2e/hr-dashboard-content.spec.ts` |
| 2.6 | At least one lead card or "No applicants" message is visible | **[automated]** `e2e/hr-dashboard-content.spec.ts` |

---

## 3. Status Filter

| # | Check | Coverage |
|---|---|---|
| 3.1 | Status filter contains all 8 canonical statuses | **[automated]** `e2e/hr-dashboard-content.spec.ts`, `e2e/hr-stage-lifecycle.spec.ts` |
| 3.2 | Filter and HR stage-controls status select have identical option lists | **[automated]** `e2e/hr-status-filter.spec.ts`, `e2e/hr-stage-lifecycle.spec.ts` |
| 3.3 | `?status=applying` URL param is reflected in the select | **[automated]** `e2e/hr-stage-lifecycle.spec.ts` |
| 3.4 | `?status=terminated` URL param shows terminated leads | **[automated]** `e2e/hr-stage-lifecycle.spec.ts` |
| 3.5 | Notion filter (`hasNotion`) select has correct options and updates URL | **[automated]** `e2e/role-and-notion-filter.spec.ts` |

---

## 4. Stage Lifecycle

| # | Check | Coverage |
|---|---|---|
| 4.1 | Selecting each of the 14 stages auto-sets the correct canonical status | **[automated]** `e2e/hr-stage-lifecycle.spec.ts` |
| 4.2 | Setting status to `terminated` calls the Chronos revoke API | **[automated]** `e2e/hr-stage-lifecycle.spec.ts` |
| 4.3 | Setting status to `joined` returns `chronosGrant.ok = true` | **[automated]** `e2e/notion-member-link.spec.ts` |
| 4.4 | Save stage + status button visible on unlocked stages | **[automated]** `e2e/hr-stage-lifecycle.spec.ts` |

---

## 5. Passing Conditions

| # | Check | Coverage |
|---|---|---|
| 5.1 | Passing condition card shows 3 options on first stage | **[automated]** `e2e/passing-condition-and-content.spec.ts` |
| 5.2 | AI prompt textarea appears only when "AI evaluation" is selected | **[automated]** `e2e/passing-condition-and-content.spec.ts` |
| 5.3 | Locked stages show badge and disable "No action required" + "AI evaluation" | **[automated]** `e2e/passing-condition-and-content.spec.ts` |
| 5.4 | Save condition persists after page reload | **[automated]** `e2e/passing-condition-and-content.spec.ts` |

---

## 6. Stage Content (Resources)

| # | Check | Coverage |
|---|---|---|
| 6.1 | `contacted` stage has 9 resources | **[automated]** `e2e/passing-condition-and-content.spec.ts` |
| 6.2 | `before_meeting` stage has 4 resources | **[automated]** `e2e/passing-condition-and-content.spec.ts` |
| 6.3 | `attended` stage has 6 resources | **[automated]** `e2e/passing-condition-and-content.spec.ts` |

---

## 7. Lead Edit Modal

| # | Check | Coverage |
|---|---|---|
| 7.1 | "Edit lead details" modal opens from the HR dashboard | **[automated]** `e2e/hr-lead-edit-modal.spec.ts`, `e2e/hr-applicant-status-delete.spec.ts` |
| 7.2 | Name field is visible and non-empty | **[automated]** `e2e/hr-lead-edit-modal.spec.ts` |
| 7.3 | Applicant status select has a valid canonical value selected | **[automated]** `e2e/hr-lead-edit-modal.spec.ts`, `e2e/hr-applicant-status-delete.spec.ts` |
| 7.4 | "Save changes" button is present | **[automated]** `e2e/hr-lead-edit-modal.spec.ts` |
| 7.5 | "Delete user permanently" opens confirmation dialog with safety text | **[automated]** `e2e/hr-lead-edit-modal.spec.ts`, `e2e/hr-applicant-status-delete.spec.ts` |
| 7.6 | Cancelling delete dismisses the dialog without deleting | **[automated]** `e2e/hr-lead-edit-modal.spec.ts` |
| 7.7 | Notion team member search field is interactive and not 503 | **[automated]** `e2e/notion-member-link.spec.ts` |

---

## 8. Applicant View

| # | Check | Coverage |
|---|---|---|
| 8.1 | `/me/application` loads without crash | **[automated]** `e2e/nav-pages-smoke.spec.ts`, `e2e/applicant-dashboard-content.spec.ts` |
| 8.2 | Shows one of: stage content, "No materials", or "on review" message | **[automated]** `e2e/passing-condition-and-content.spec.ts`, `e2e/applicant-dashboard-content.spec.ts` |
| 8.3 | Page has at least one heading (not blank) | **[automated]** `e2e/applicant-dashboard-content.spec.ts` |
| 8.4 | No 500 / "Something went wrong" text | **[automated]** `e2e/applicant-dashboard-content.spec.ts` |
| 8.5 | New application form (`efestos.international/apply`) creates DB row visible in HR dashboard | **[manual]** Submit a real application; confirm the lead appears in `/me/hr` |

---

## 9. Shared Identity with Chronos

| # | Check | Coverage |
|---|---|---|
| 9.1 | Setting status to `graduated` or `terminated` in HR revokes `users.is_active` in Chronos | **[automated]** `e2e/hr-stage-lifecycle.spec.ts` (terminated path); graduated is manual |
| 9.2 | Setting status to `joined` grants Chronos access (`is_active = true`) | **[automated]** `e2e/notion-member-link.spec.ts` |
| 9.3 | Chronos Users directory shows same `flolabs_users.status` without batch sync | **[manual]** Edit a lead's status in HR; open Chronos for the same email and verify |
| 9.4 | `flolabs_users` table exists in shared Neon DB | **[manual]** `SELECT to_regclass('public.flolabs_users');` after schema-altering deploys |
| 9.5 | Lead merge: canonical row keeps merged emails; secondaries become `closed`/`is_active=false` | **[manual]** Run merge via `POST /api/admin/leads/merge`; spot-check `time_entries.user_id` |

---

## 10. Admin / HR-only APIs

| # | Check | Coverage |
|---|---|---|
| 10.1 | HubSpot CSV sync returns 403 without HR session | **[automated]** `e2e/hubspot-csv-sync-admin.spec.ts` |
| 10.2 | HubSpot CSV sync with HR session upserts contacts and returns `ok: true` | **[automated]** `e2e/hubspot-csv-sync-admin.spec.ts` |
| 10.3 | Notion team member search responds < 90 s after warm-up | **[automated]** `e2e/team-member-search-speed.spec.ts` |
| 10.4 | Saving a role for a lead shows "Saved" confirmation | **[automated]** `e2e/role-and-notion-filter.spec.ts` |

---

## Running the Full Suite

```bash
cd hephaestus-international

# All specs
npx playwright test --config playwright.config.ts

# Individual spec
npx playwright test e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts

# With HTML report
npx playwright test --config playwright.config.ts --reporter=html && npx playwright show-report
```

Credentials and `baseUrl` are read from `test_assets/test_users.json`.

---

## Reference: Status Definitions

| Status | Meaning | Hephaestus access | Chronos access |
|---|---|---|---|
| `applying` | Applied; not yet reached second meeting | Yes | No |
| `waiting` | Passed second meeting; awaiting agreement | Yes | No |
| `signed` | Agreement signed; pending Chronos onboarding | Yes | No |
| `joined` | Onboarded to Chronos (`is_active = true`) | Yes | Yes |
| `approved` | Manual HR override | Yes | No |
| `rejected` | Access fully revoked | No | No |
| `graduated` | Completed program; Chronos revoked (`is_active = false`) | Yes | No |
| `terminated` | Left program; Chronos revoked (`is_active = false`) | Yes | No |

## Reference: Stage → Status Mapping

| # | Stage ID | Label | Canonical status | Passing condition default |
|---|---|---|---|---|
| 1 | `application_submitted` | Application submitted | `applying` | `none` |
| 2 | `new` | New | `applying` | `none` |
| 3 | `contacted` | Contacted | `applying` | `ai` |
| 4 | `interested_review` | Interested review | `applying` | `hr` |
| 5 | `before_meeting` | Before meeting | `applying` | `ai` |
| 6 | `meeting_recordings_submitted` | Meeting recordings submitted | `applying` | `hr` |
| 7 | `saturday_meeting` | Saturday meeting | `applying` | `hr` |
| 8 | `attended` | Attended | `applying` | `ai` |
| 9 | `masterclass_submitted` | Masterclass submitted | `applying` | `hr` |
| 10 | `second_meeting` | Oliver 1-on-1 | `waiting` | `hr` (locked) |
| 11 | `agreement_sent` | Agreement sent | `waiting` | `hr` (locked) |
| 12 | `agreement_signed` | Agreement signed | `signed` | `hr` (locked) |
| 13 | `chronos_synced` | Chronos synced | `joined` | `hr` (locked) |
| 14 | `joined` | Joined | `joined` | `hr` (locked) |

**Locked stages** (`second_meeting` → `joined`): HR approval mandatory. Passing condition UI disables other options; Save button is hidden.
