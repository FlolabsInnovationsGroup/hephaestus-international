# Hephaestus Deployment

For full system context, read `ARCHITECTURE.md`. This file covers how to release and verify.

## Deploy flow (primary) — AWS CodeBuild

| Item | Value |
|---|---|
| CodeBuild project | `hephaestus-international-deploy` |
| Build spec | `buildspec.yml` (repo root) |
| Source bucket | `s3://flolabs-hephaestus-codebuild/source.zip` |
| IAM role | `arn:aws:iam::975049954782:role/hephaestus-international-codebuild` |
| ECR repository | `hephaestus-international` |
| Image tag | `git-<12-char-sha>` |
| App Runner service | `hephaestus-international` |
| Service ARN | `arn:aws:apprunner:us-east-1:975049954782:service/hephaestus-international/7b3d7cb4f0894c21ae16f15b985fedc7` |
| AWS URL | `https://fykgssqbvg.us-east-1.awsapprunner.com` |
| Production domain | `https://efestos.international` |
| Region / account | `us-east-1` / `975049954782` |

### Steps

1. Create a source archive from `hephaestus-international` (build context is `./frontend`; `buildspec.yml` is at repo root):

```powershell
cd hephaestus-international
git archive -o source.zip HEAD
```

2. Upload:

```bash
aws s3 cp source.zip s3://flolabs-hephaestus-codebuild/source.zip --region us-east-1
```

3. Start CodeBuild:

```bash
aws codebuild start-build \
  --project-name hephaestus-international-deploy \
  --region us-east-1 \
  --environment-variables-override name=GIT_SHA,value=$(git rev-parse HEAD),type=PLAINTEXT
```

4. Wait for `SUCCEEDED`. `post_build` updates App Runner and verifies `GET /api/health` with matching `commitSha`.

5. If HR tests are needed, ensure the HR bootstrap user still has `hr_binary_role` (see `QA_CHECKLIST.md`), then run Playwright against the AWS URL.

Project definition: `infra/codebuild-project.json`. IAM: `infra/codebuild-deploy-policy.json`, `infra/codebuild-logs-policy.json`.

## Deploy flow (fallback) — GitHub Actions

Push to `main` triggers `.github/workflows/deploy-aws-apprunner.yml` when Actions billing is available:

1. OIDC → `arn:aws:iam::975049954782:role/hephaestus-international-github-actions-deploy`
2. Docker build from `./frontend` with Strapi URL build arg
3. Push `git-<12-char-sha>` to ECR `hephaestus-international`
4. Read SSM runtime secrets, update App Runner, verify health

Same App Runner service and proof standard as CodeBuild.

## Deployment proof standard

A deployment is proven when all of the following are true:

1. CodeBuild or GitHub Actions completed successfully
2. App Runner is serving the expected `git-<sha>` image
3. `GET https://fykgssqbvg.us-east-1.awsapprunner.com/api/health` returns `"ok":true` with matching `commitSha`
4. The affected live user path works on the deployed surface

## Deployment rule

For Hephaestus, the normal deploy path must **not** depend on the local machine for runtime proof:

- No local Docker build for routine deploys
- No local browser validation as deployment proof
- Source of truth for production is AWS (CodeBuild or GHA, ECR, SSM, App Runner)

## AWS resources

| Resource | Value |
|---|---|
| VPC connector | `arn:aws:apprunner:us-east-1:975049954782:vpcconnector/flolabs-chronos-vpc-connector/1/41208035860d463f92e083af41247fe1` |
| App Runner ECR role | `arn:aws:iam::975049954782:role/hephaestus-international-apprunner-ecr-access-role` |
| GitHub Actions role (fallback) | `arn:aws:iam::975049954782:role/hephaestus-international-github-actions-deploy` |

## IAM policy note (GitHub Actions fallback)

The role `hephaestus-international-github-actions-deploy` inline policy must grant `ssm:GetParameter` on every SSM parameter the workflow reads. When adding parameters, extend `ReadSharedRuntimeSecrets` ARNs.

## Runtime secret source of truth

Values are sourced from **AWS SSM** during CodeBuild `pre_build` or the GHA deploy job:

| SSM Parameter | Runtime env var |
|---|---|
| `/flolabs-chronos/DATABASE_URL` | `DATABASE_URL`, `CHRONOS_DB_DATABASE_URL`, `FL_CHRONOS_DATABASE_URL` |
| `/hephaestus-international/CHRONOS_SYNC_API_URL` | `CHRONOS_SYNC_API_URL` |
| `/hephaestus-international/CHRONOS_SYNC_TOKEN` | `CHRONOS_SYNC_TOKEN` |
| `/hephaestus-international/CONTENT_STRAPI_URL` | `CONTENT_STRAPI_URL`, `NEXT_PUBLIC_STRAPI_URL` (also build arg in GHA) |
| `/hephaestus-international/STRAPI_API_TOKEN` | `STRAPI_API_TOKEN` |
| `/hephaestus-international/CONTENT_STRAPI_API_TOKEN` | `CONTENT_STRAPI_API_TOKEN` |
| `/flolabs-chronos/RESEND_API_KEY` | `RESEND_API_KEY` |
| `/flolabs-chronos/EMAIL_FROM` | `EMAIL_FROM` |
| `/flolabs-chronos/NOTION_API_KEY` | `NOTION_API_KEY` (CodeBuild) |
| `/flolabs-chronos/CRON_SECRET` | `CRON_SECRET` (CodeBuild) |
| `/flolabs-chronos/OPENAI_API_KEY` | `OPENAI_API_KEY` (CodeBuild) |

`NEXTAUTH_SECRET` is preserved from the current App Runner service during CodeBuild, or supplied from GitHub `AUTH_SECRET` in the GHA path.

## Files that define the deploy path

- `buildspec.yml` — primary CodeBuild pipeline
- `.github/workflows/deploy-aws-apprunner.yml` — fallback CI/CD
- `infra/codebuild-project.json` — CodeBuild project config

## Shared applicant status (`flolabs_users.status`)

- HR **Edit lead** writes `flolabs_users.status` (dropdown includes `graduated` / `terminated`). Chronos mirrors the same column read-only.
- **Permanent delete:** Edit lead → **Delete user permanently** → confirmation modal → `POST /api/admin/leads/delete` (archives Notion Team Member page, removes DB rows). Prefer **Terminated** / **Graduated** when the person should remain in HR history.
- Automated checks: `e2e/hr-applicant-status-delete.spec.ts`, `e2e/hr-status-filter.spec.ts` (9 statuses).

## How to validate a deploy

```bash
aws codebuild list-builds-for-project --project-name hephaestus-international-deploy --region us-east-1 --max-items 3

aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:975049954782:service/hephaestus-international/7b3d7cb4f0894c21ae16f15b985fedc7 \
  --region us-east-1 \
  --query 'Service.{Status:Status,ImageId:SourceConfiguration.ImageRepository.ImageIdentifier}'

curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health | python3 -m json.tool
```
