# Hephaestus Deployment

This file describes the **current proven deployment method** for Hephaestus.

**Architecture context:** For the full system picture (App Runner, RDS, auth, Chronos integration), read `ARCHITECTURE.md`. This file focuses on **how** to release and verify.

## Deploy Flow

Push to `main` triggers `.github/workflows/deploy-aws-apprunner.yml`:

1. GitHub Actions assumes AWS credentials via OIDC (`arn:aws:iam::975049954782:role/hephaestus-international-github-actions-deploy`)
2. Docker Buildx builds the image from `./frontend`; Strapi URL is injected as a build arg
3. Image is tagged `git-<12-char-sha>` and pushed immutably to ECR (`hephaestus-international`)
4. Runtime secrets are read from AWS SSM (see table below)
5. App Runner service is updated with the new image and full runtime env vars
6. Workflow waits for App Runner to become idle before triggering the update
7. Workflow polls the operation until status is `SUCCEEDED`
8. Workflow verifies `GET /api/health` returns `"ok":true` with the matching `commitSha`

## Deployment Proof Standard

A deployment is proven when all of the following are true:

1. GitHub Actions run completed successfully
2. App Runner is serving the expected `git-<sha>` image
3. `GET https://fykgssqbvg.us-east-1.awsapprunner.com/api/health` returns `"ok":true` with matching `commitSha`
4. The affected live user path works on the deployed surface

## Deployment Rule

For Hephaestus, the normal deploy path must **not** depend on the local machine:

- No local Docker build for routine deploys
- No local browser or local app validation as deployment proof
- Source of truth for production is AWS (App Runner, ECR, SSM)

## AWS Resources

| Resource | Value |
|---|---|
| App Runner service | `hephaestus-international` |
| Service ARN | `arn:aws:apprunner:us-east-1:975049954782:service/hephaestus-international/7b3d7cb4f0894c21ae16f15b985fedc7` |
| AWS URL | `https://fykgssqbvg.us-east-1.awsapprunner.com` |
| Production domain | `https://efestos.international` (App Runner custom domain) |
| ECR repository | `hephaestus-international` |
| GitHub Actions role | `arn:aws:iam::975049954782:role/hephaestus-international-github-actions-deploy` |
| App Runner ECR role | `arn:aws:iam::975049954782:role/hephaestus-international-apprunner-ecr-access-role` |
| VPC connector | `arn:aws:apprunner:us-east-1:975049954782:vpcconnector/flolabs-chronos-vpc-connector/1/41208035860d463f92e083af41247fe1` |
| Region / Account | `us-east-1` / `975049954782` |

## IAM Policy Note

The GitHub Actions role (`hephaestus-international-github-actions-deploy`) inline policy `github-actions-hephaestus-deploy` must grant `ssm:GetParameter` on every SSM parameter listed below. If a new parameter is added to the deploy workflow, update the IAM policy's `ReadSharedRuntimeSecrets` statement to include its ARN (`arn:aws:ssm:us-east-1:975049954782:parameter/<name>`) — otherwise the "Resolve runtime secrets" step will fail with `AccessDeniedException`.

## Runtime Secret Source of Truth

All runtime values are sourced from **AWS SSM** during the GitHub Actions deploy:

| SSM Parameter | Runtime env var |
|---|---|
| `/flolabs-chronos/DATABASE_URL` | `DATABASE_URL`, `CHRONOS_DB_DATABASE_URL`, `FL_CHRONOS_DATABASE_URL` |
| `/hephaestus-international/CHRONOS_SYNC_API_URL` | `CHRONOS_SYNC_API_URL` |
| `/hephaestus-international/CHRONOS_SYNC_TOKEN` | `CHRONOS_SYNC_TOKEN` |
| `/hephaestus-international/CONTENT_STRAPI_URL` | `CONTENT_STRAPI_URL`, `NEXT_PUBLIC_STRAPI_URL` (also a build arg) |
| `/hephaestus-international/STRAPI_API_TOKEN` | `STRAPI_API_TOKEN` |
| `/hephaestus-international/CONTENT_STRAPI_API_TOKEN` | `CONTENT_STRAPI_API_TOKEN` |
| `/flolabs-chronos/RESEND_API_KEY` | `RESEND_API_KEY` |
| `/flolabs-chronos/EMAIL_FROM` | `EMAIL_FROM` |

From **GitHub Actions secrets**:

| Secret | Runtime env var |
|---|---|
| `AUTH_SECRET` | `NEXTAUTH_SECRET` |
| `OPENAI_API_KEY` | `OPENAI_API_KEY` |

## Files That Define the Deploy Path

- `.github/workflows/deploy-aws-apprunner.yml` — the full CI/CD pipeline

## How to Validate a Deploy

```bash
# 1. Check latest Actions runs
gh run list --limit 5

# 2. Check App Runner service status and running image
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:975049954782:service/hephaestus-international/7b3d7cb4f0894c21ae16f15b985fedc7 \
  --region us-east-1 \
  --query 'Service.{Status:Status,ImageId:SourceConfiguration.ImageRepository.ImageIdentifier}'

# 3. Verify health metadata
curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health | python3 -m json.tool

# 4. Test the affected user path on the live surface
```
