# QA Protocol — Hephaestus

## Every-Deploy Protocol

Every push to `main` runs through this sequence automatically:

1. **CI/CD builds and deploys** (`deploy` job) — image is pushed to ECR, App Runner is updated, health endpoint is verified against the new `commitSha`
2. **E2E smoke tests run** (`e2e` job, depends on `deploy`) — Playwright hits the live AWS URL with real credentials

A deploy is only clean when **both jobs pass**. If the `e2e` job fails, the deploy still went out but the surface is broken — investigate immediately.

## Automated Test Coverage

| Test file | Area covered | Tests |
|---|---|---|
| `e2e/hr-status-filter.spec.ts` | Status filter dropdown | 7-option parity, HR controls match |
| `e2e/hr-stage-lifecycle.spec.ts` | Stage → status mapping, filter views, terminated access | 5 tests |
| `e2e/passing-condition-and-content.spec.ts` | Passing condition card, stage content resources, applicant view | 8 tests |
| `e2e/forgot-password.spec.ts` | Forgot-password UI + API; token creation; anti-enumeration | 3 tests |

### What the automated suite covers

- **Auth** — HR login lands on correct dashboard; applicant login lands on `/me/application`
- **Status filter** — 7 canonical statuses present, no stale `active` value
- **Stage → status mapping** — all 14 stages auto-suggest the correct canonical status on select
- **Passing condition card** — present on all stages with 3 options (No action required / AI evaluation / HR approval)
- **AI prompt textarea** — appears only when AI evaluation is selected, hidden otherwise
- **Locked stages** — `second_meeting`, `agreement_sent`, `agreement_signed`, `chronos_synced`, `joined` show badge and disable other options
- **Passing condition save** — save triggers confirmation flash; persists across page reload
- **Stage content** — `contacted` = 13 resources, `before_meeting` = 4, `attended` = 6
- **Applicant dashboard** — shows stage content cards, no-materials message, or on-review message

### What is NOT automated (manual checks)

| Check | Why manual | How to test |
|---|---|---|
| Chronos user sync on `joined` | Requires Chronos DB inspection | Set status → `joined`, check Chronos `users.is_active = true` |
| Chronos access revocation on `terminated` | Requires Chronos DB + login attempt | Set status → `terminated`, check `is_active = false`, verify timer app 401 |
| Resend email delivery | No inbox automation; token creation is verified automatically | Spot-check inbox after a deploy that touches email code |
| AI stage review output | Subjective / non-deterministic | Submit applicant content, check HR review panel |
| New application form → DB row | End-to-end form submission | Fill out efestos.international/apply, verify row in HR dashboard |

## Running Tests Locally

```bash
cd hephaestus-international

# Full suite
npx playwright test --config playwright.config.ts

# Single file
npx playwright test e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts
npx playwright test e2e/passing-condition-and-content.spec.ts --config playwright.config.ts

# With HTML report (opens browser after run)
npx playwright test --config playwright.config.ts --reporter=html && npx playwright show-report
```

Credentials and `baseUrl` are read from `test_assets/test_users.json`. That file is committed; do not hardcode credentials directly in spec files.

## CI Automation

The `e2e` job in `.github/workflows/deploy-aws-apprunner.yml` runs automatically after every successful deploy:

- **Trigger:** `needs: deploy` — only runs if the deploy job succeeds
- **Environment:** `ubuntu-latest`, Chromium via `npx playwright install chromium --with-deps`
- **Base URL:** `PLAYWRIGHT_BASE_URL=https://fykgssqbvg.us-east-1.awsapprunner.com`
- **Credentials:** read from `test_assets/test_users.json` (committed)
- **Artifacts:** HTML report + screenshots uploaded as `playwright-report-<sha>`, retained 14 days

To view results of a past run: GitHub → Actions → the run → `playwright-report-<sha>` artifact.

## Manual Post-Deploy Smoke Test

When you need to verify a deploy by hand (not relying on CI):

```bash
# 1. Confirm health endpoint matches the commit
curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health | python3 -m json.tool

# 2. Check App Runner is RUNNING
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:975049954782:service/hephaestus-international/7b3d7cb4f0894c21ae16f15b985fedc7 \
  --region us-east-1 \
  --query 'Service.{Status:Status,Image:SourceConfiguration.ImageRepository.ImageIdentifier}'

# 3. Run the E2E suite manually
cd hephaestus-international && npx playwright test --config playwright.config.ts
```

Then spot-check these in the browser (HR credentials: `zoom@flomadlabs.com`):

- [ ] `/me/hr` loads, status filter shows 7 options
- [ ] `/me/hr/stages` loads, passing condition card visible on first stage
- [ ] Contacted stage shows 13 resources
- [ ] Locked stage (`second_meeting`) shows HR-approval badge, other options disabled
- [ ] Save a condition change, reload, confirm it persists

---

## Reference: Status Definitions

| Status | Meaning | Hephaestus access | Chronos access |
|---|---|---|---|
| `applying` | Applied; has not yet reached second meeting | ✅ Yes | ❌ No |
| `waiting` | Passed second meeting; waiting for agreement | ✅ Yes | ❌ No |
| `signed` | Agreement signed; pending Chronos onboarding | ✅ Yes | ❌ No |
| `joined` | Onboarded to Chronos | ✅ Yes | ✅ Yes (`is_active = true`) |
| `approved` | Manual HR override | ✅ Yes | ❌ No |
| `rejected` | Access fully revoked | ❌ No | ❌ No |
| `terminated` | Chronos access revoked; Hephaestus preserved | ✅ Yes | ❌ No (`is_active = false`) |

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

**Locked stages** (`second_meeting` → `joined`): HR approval is mandatory. The passing condition UI disables other options for these stages and the Save button is hidden.
