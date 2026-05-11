# Hephaestus — Quick Start

Get up to speed on the Hephaestus internship applicant tracking platform.

## What Is This?

Hephaestus is FloLabs' internal HR tool for tracking internship applicants from initial application through 14 pipeline stages to Chronos onboarding. It lives at `https://efestos.international` and deploys automatically to AWS App Runner on every push to `main`.

This is **not** a local-first app — production is on AWS, tests run against AWS, and deploys go to AWS.

---

## Prerequisites

- Node.js 18+
- AWS CLI configured for account `975049954782` (region `us-east-1`)
- `gh` CLI authenticated (for CI/CD monitoring)

---

## Verify Production is Healthy

```bash
curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health
```

Returns `{ "ok": true, "commitSha": "...", ... }` when the service is up.

---

## Run Type Check

```bash
cd frontend
npx tsc --noEmit
```

Always run this before pushing. TypeScript errors will cause the Docker build to fail in CI.

---

## Run E2E Tests

Tests run against the live production URL. Credentials are in `test_assets/test_users.json`.

```bash
# From repo root
npx playwright test e2e/hr-status-filter.spec.ts e2e/hr-stage-lifecycle.spec.ts --config playwright.config.ts
```

---

## Deploy

Push to `main`. GitHub Actions builds a Docker image, tags it `git-<sha>`, pushes to ECR, and updates App Runner:

```bash
git push origin main
```

Monitor the deploy:
```bash
gh run list --limit 5
```

After the run succeeds, verify:
```bash
curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health
```

---

## Key Files to Know

| File | Why It Matters |
|---|---|
| `frontend/app/application-data.ts` | `ApplicantStatus` type — source of truth for all valid statuses |
| `frontend/lib/application-db.ts` | All database access, including `chronosUserToApplicant()` |
| `frontend/lib/chronos-sync.ts` | Chronos access grant/revoke on status change |
| `frontend/components/hr-stage-controls.tsx` | Stage/status dropdowns, `statusForStage()` auto-suggest |
| `frontend/app/api/admin/leads/stage/route.ts` | The API that drives all HR stage/status saves |
| `test_assets/test_users.json` | HR and applicant test credentials |

---

## Read Next

- `ARCHITECTURE.md` — full system, status/stage tables, AWS resource inventory
- `DEPLOYMENT.md` — CI/CD pipeline details, IAM policy note, verification commands
- `CLAUDE.md` — coding rules, status change checklist, common task recipes
- `QA_CHECKLIST.md` — HR pipeline test cases
