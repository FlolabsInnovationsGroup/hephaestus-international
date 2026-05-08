# QA Checklist — Hephaestus HR Pipeline

## Status Definitions

| Status | Meaning | Hephaestus access | Chronos access |
|---|---|---|---|
| `applying` | Applied; has not yet reached the second meeting stage | ✅ Yes | ❌ No |
| `waiting` | Passed second meeting; waiting for agreement to be signed | ✅ Yes | ❌ No |
| `signed` | Agreement signed; pending Chronos onboarding | ✅ Yes | ❌ No |
| `joined` | Onboarded to Chronos; not yet using timers | ✅ Yes | ✅ Yes (is_active = true) |
| `active` | Actively using Chronos (has timer sessions) | ✅ Yes | ✅ Yes (is_active = true) |
| `approved` | Approved by HR for a specific path (manual override) | ✅ Yes | ❌ No |
| `rejected` | Rejected; all platform access revoked | ❌ No | ❌ No |
| `terminated` | Chronos access revoked; FloLabs account preserved | ✅ Yes | ❌ No (is_active = false) |

## Stage → Status Canonical Mapping

When HR moves a lead to a stage, the status should auto-update to the value in the "Canonical status" column. HR can override manually.

| Stage # | Stage ID | Stage label | Canonical status |
|---|---|---|---|
| 1 | `application_submitted` | Application submitted | `applying` |
| 2 | `new` | New | `applying` |
| 3 | `contacted` | Contacted | `applying` |
| 4 | `interested_review` | Interested review | `applying` |
| 5 | `before_meeting` | Before meeting | `applying` |
| 6 | `meeting_recordings_submitted` | Meeting recordings submitted | `applying` |
| 7 | `saturday_meeting` | Saturday meeting | `applying` |
| 8 | `attended` | Attended | `applying` |
| 9 | `masterclass_submitted` | Masterclass submitted | `applying` |
| 10 | `second_meeting` | Second meeting | `waiting` |
| 11 | `agreement_sent` | Agreement sent | `waiting` |
| 12 | `agreement_signed` | Agreement signed | `signed` |
| 13 | `chronos_synced` | Chronos synced | `joined` |
| 14 | `joined` | Joined | `active` |

## Access Control Rules

### Hephaestus login allowed for:
- All statuses **except** `rejected`
- This includes `terminated` — they keep their FloLabs profile

### Chronos access (users.is_active):
- `joined` → `is_active = true` (granted automatically when HR sets status)
- `active` → `is_active = true` (granted automatically when HR sets status)
- `terminated` → `is_active = false` (revoked automatically when HR sets status)
- All other statuses → no Chronos access change

## QA Test Cases

### TC-01: Status filter and stage controls parity
**Test file:** `e2e/hr-status-filter.spec.ts`
- [ ] The `select[name="status"]` filter dropdown contains exactly: `applying`, `waiting`, `signed`, `joined`, `active`, `approved`, `rejected`, `terminated`
- [ ] The HR stage controls status select contains the same 8 values
- [ ] Both selects sorted are identical

### TC-02: Stage-to-status auto-suggest
**Test file:** `e2e/hr-stage-lifecycle.spec.ts` → "Stage-to-status mapping"
- [ ] Selecting stage 1–9 (application_submitted → masterclass_submitted) auto-sets status to `applying`
- [ ] Selecting stage 10 (second_meeting) auto-sets status to `waiting`
- [ ] Selecting stage 11 (agreement_sent) auto-sets status to `waiting`
- [ ] Selecting stage 12 (agreement_signed) auto-sets status to `signed`
- [ ] Selecting stage 13 (chronos_synced) auto-sets status to `joined`
- [ ] Selecting stage 14 (joined) auto-sets status to `active`

### TC-03: Terminated status — Chronos revocation
**Test file:** `e2e/hr-stage-lifecycle.spec.ts` → "Terminated status"
- [ ] When HR sets status to `terminated` and clicks Save, the API `/api/admin/leads/stage` responds with `{ ok: true, chronosRevoke: { ok: true } }`
- [ ] The corresponding Chronos `users` row has `is_active = false` after save
- [ ] A terminated user can still log into Hephaestus (`/login` succeeds)
- [ ] A terminated user cannot log into Chronos (timer app returns 401/403)

### TC-04: Status filter — applying
**Test file:** `e2e/hr-stage-lifecycle.spec.ts` → "Filter by applying"
- [ ] Navigating to `/me/hr?status=applying` shows only leads with `applying` status
- [ ] The filter dropdown reflects `applying` as the selected value

### TC-05: Status filter — terminated
**Test file:** `e2e/hr-stage-lifecycle.spec.ts` → "Filter by terminated"
- [ ] Navigating to `/me/hr?status=terminated` renders without errors
- [ ] The filter dropdown reflects `terminated` as the selected value

### TC-06: Rejected status — login blocked
- [ ] A user with `rejected` status cannot log into Hephaestus (`/login` returns null/redirect)
- [ ] A user with `rejected` status cannot log into Chronos

### TC-07: Applying users — Hephaestus login allowed
- [ ] A user with `applying` status can log into Hephaestus
- [ ] They land on `/me/application`, not HR dashboard
- [ ] They can see their current stage in the application pipeline

### TC-08: Active Chronos users show as `active` in HR dashboard
- [ ] Users in the Chronos `users` table with `is_active = true` appear in the HR dashboard with status `active`
- [ ] Users in the Chronos `users` table with `is_active = false` appear with status `terminated`

### TC-09: New applicant default status
- [ ] A newly submitted application form creates a `website_applicants` row with `status = 'applying'`
- [ ] Their initial stage is `application_submitted`

## Playwright Test Execution

```bash
# Run all HR lifecycle tests
cd hephaestus-international
npx playwright test e2e/hr-status-filter.spec.ts e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts

# Run individual suites
npx playwright test e2e/hr-status-filter.spec.ts --config playwright.config.ts
npx playwright test e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts
```

## Deployment Validation Checklist

After each deploy to AWS App Runner:

- [ ] `GET /api/health` returns 200
- [ ] HR dashboard loads at `/me/hr` (HR credentials)
- [ ] Status filter shows 8 options (applying, waiting, signed, joined, active, approved, rejected, terminated)
- [ ] Stage controls status select shows same 8 options
- [ ] Changing stage auto-updates status to canonical value
- [ ] Save with `terminated` status calls Chronos revocation
- [ ] Filter by `applying` works without JS errors
- [ ] Filter by `terminated` works without JS errors
