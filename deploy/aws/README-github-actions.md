# GitHub Actions AWS deploy bootstrap (Hephaestus)

This sets up Hephaestus for AWS-native deploys on every push to `main`, reusing the same AWS account and shared Chronos database.

## What it creates

- GitHub OIDC provider in AWS (`token.actions.githubusercontent.com`) if missing
- IAM role: `hephaestus-international-github-actions-deploy`
- Inline IAM policy for:
  - ECR push / digest lookup
  - App Runner update / describe / list-operations
  - SSM read for Hephaestus + Chronos shared parameters
- GitHub secrets for the Hephaestus workflow

## Command

```powershell
powershell -ExecutionPolicy Bypass -File deploy/aws/setup-github-actions-deploy.ps1
```

## Required local env input

Create `frontend/.env.production.local` (or `frontend/.env.local`) with:

- `AUTH_SECRET`
- `OPENAI_API_KEY` (optional if not used)
- `APP_RUNNER_SERVICE_ARN`
- `APP_RUNNER_URL`
- `APP_RUNNER_ECR_ACCESS_ROLE_ARN`
- `VPC_CONNECTOR_ARN`
- `CHRONOS_SYNC_API_URL`
- `CHRONOS_SYNC_TOKEN`
- `CONTENT_STRAPI_URL`
- `STRAPI_API_TOKEN`

## SSM parameters used by deploy

- `/flolabs-chronos/DATABASE_URL` (shared credentials and DB)
- `/flolabs-chronos/RESEND_API_KEY` (shared email infra)
- `/flolabs-chronos/EMAIL_FROM` (shared sender)
- `/hephaestus-international/CHRONOS_SYNC_API_URL`
- `/hephaestus-international/CHRONOS_SYNC_TOKEN`
- `/hephaestus-international/CONTENT_STRAPI_URL`
- `/hephaestus-international/STRAPI_API_TOKEN`
