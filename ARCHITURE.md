# Hephaestus International — Architecture Quick Reference

> This file is a brief summary. The authoritative architecture document is **`ARCHITECTURE.md`**.

## Production runtime

| Component | Service |
|-----------|---------|
| App server | Next.js 16 (App Router) on **AWS App Runner** (`us-east-1`) |
| Container registry | **Amazon ECR** — immutable `git-<sha>` tags |
| Database | **AWS RDS PostgreSQL** (shared with Chronos via `CHRONOS_DB_DATABASE_URL`) |
| Content backend | Strapi v5 on **Railway** |
| Auth | NextAuth.js v5 credentials |
| Blob storage | Vercel Blob (`@vercel/blob`) |

## Deploy path

`git push origin main` → GitHub Actions (`.github/workflows/deploy-aws-apprunner.yml`) → ECR → App Runner.

## Service URLs

- App Runner: `https://fykgssqbvg.us-east-1.awsapprunner.com`
- Custom domain: `hephaestus.international`
- Strapi backend: `https://strapi-production-7ecb.up.railway.app`

See **`DEPLOYMENT_GUIDE.md`** for setup and bootstrap steps.
