# Hephaestus.International

FloLabs' **internship applicant tracking platform**, live at `https://efestos.international` (also `https://hephaestus.international`). This is an **internal operations tool** — not a public SaaS.

## What This Is

Hephaestus manages the full lifecycle of FloLabs internship applicants:
- Captures applications and routes them through a **14-stage HR pipeline**
- Provides HR with a dashboard to manage leads, filter by status, set stage/status, and trigger Chronos access
- **Owns the `flolabs_users` identity table** — shared with FloLabs Chronos (the time-tracking system) via the same Neon PostgreSQL database
- Allows applicants to log in and view their application progress
- HR sets `graduated` and `terminated` status here; Chronos reads `flolabs_users.status` read-only

---

## Production

| | |
|---|---|
| **Production domain** | `https://efestos.international` |
| **AWS App Runner URL** | `https://fykgssqbvg.us-east-1.awsapprunner.com` |
| **Health check** | `GET /api/health` returns `{ ok, commitSha, imageTag, ... }` |
| **Database** | Neon serverless PostgreSQL — `ep-broad-shadow-anqzuaqr.c-6.us-east-1.aws.neon.tech/neondb` (shared with Chronos) |

**Testing rule:** Test only against the live AWS URL. Do not use the local dev server as deployment proof.

---

## Architecture

| Layer | Role |
|--------|------|
| **Frontend** (`frontend/`) | Next.js 16 App Router, TypeScript, Tailwind CSS — Docker build context |
| **Database** | Shared **Neon serverless PostgreSQL** with FloLabs Chronos. URL in SSM `/flolabs-chronos/DATABASE_URL`. Identity table: `flolabs_users`. |
| **Auth** | Cookie-based session (`fl_preview_session`), NextAuth secret = `AUTH_SECRET` |
| **Deploy** | AWS CodeBuild → ECR → App Runner (primary); GitHub Actions → ECR → App Runner (fallback) |
| **CMS (optional)** | Strapi — for public marketing pages only. HR pipeline works entirely without it. |
| **AI chatbot** | Paula uses OpenAI (`OPENAI_API_KEY`) or rule-based fallback |
| **Email** | Resend (shared SSM params with Chronos) |

---

## Shared Identity with Chronos

`flolabs_users` is the **single identity table** used by both Hephaestus and Chronos:
- **Hephaestus owns DDL and writes** — `ensurePostgresSchema()` in `frontend/lib/application-db.ts` manages the schema
- **Chronos reads** `flolabs_users.status` to determine display (read-only on Chronos Users → Edit)
- `graduated` and `terminated` status → Chronos `is_active = false` (blocks Chronos login)
- `joined` status → Chronos `is_active = true` (grants Chronos access)
- **Permanent delete** of a user is only performed from Hephaestus HR dashboard

---

## Key Applicant Statuses

| Status | Hephaestus login | Chronos access |
|---|---|---|
| `applying` / `waiting` / `signed` / `approved` | ✅ | ❌ |
| `joined` | ✅ | ✅ (`is_active = true`) |
| `rejected` | ❌ | ❌ |
| `graduated` | ✅ | ❌ (`is_active = false`) |
| `terminated` | ✅ | ❌ (`is_active = false`) |

---

## Repository Layout

```text
frontend/          # Next.js app (Docker build context)
strapi/app/        # Optional Strapi 5 CMS (marketing pages only)
e2e/               # Playwright E2E tests (run against live AWS URL)
test_assets/       # Test credentials (test_users.json)
scripts/           # Historical migration scripts
buildspec.yml      # AWS CodeBuild primary deploy pipeline
.github/workflows/ # GitHub Actions fallback deploy pipeline
```

---

## Environment Variables (Summary)

All production secrets are in **AWS SSM**, fetched at deploy time:

| SSM Parameter | Purpose |
|---|---|
| `/flolabs-chronos/DATABASE_URL` | Shared Neon PostgreSQL (`neondb`) |
| `/hephaestus-international/CHRONOS_SYNC_API_URL` | Chronos sync endpoint |
| `/hephaestus-international/CHRONOS_SYNC_TOKEN` | Chronos sync auth token |
| `/hephaestus-international/CONTENT_STRAPI_URL` | Optional Strapi CMS URL |
| `/hephaestus-international/CONTENT_STRAPI_API_TOKEN` | Strapi token |
| `/flolabs-chronos/RESEND_API_KEY` | Email sending |
| `/flolabs-chronos/EMAIL_FROM` | Sender address |

GitHub Actions secrets: `AUTH_SECRET` (→ `NEXTAUTH_SECRET`), `OPENAI_API_KEY`.

---

## Troubleshooting

- **App not serving new image:** check `aws apprunner describe-service` for image tag vs expected `git-<sha>`
- **Login issues in Playwright:** React hydration — always use `waitUntil: 'load'` and `waitFor({ state: 'visible' })` before `.fill()`
- **Type errors:** run `npx tsc --noEmit` from `frontend/` before pushing
- **CI/CD failures:** check GitHub Actions logs; most common cause is missing SSM ARN in IAM policy (see `DEPLOYMENT.md`)

---

Maintained by Flo Labs / FloLabs International development team.
