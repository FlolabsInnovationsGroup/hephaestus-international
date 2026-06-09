# Hephaestus Deployment

For full system context, read `ARCHITECTURE.md`. This file covers how to release and verify.

## Production stack

| Item | Value |
|---|---|
| **Production domain** | `https://efestos.international` |
| **EC2 instance** | `i-0292b7ec02f26a25b` (`44.195.108.173`, `us-east-1`) |
| **Docker Compose dir** | `/opt/hosting/` on the EC2 |
| **ECR repository** | `975049954782.dkr.ecr.us-east-1.amazonaws.com/hephaestus-international` |
| **CodeBuild project** | `hephaestus-international-deploy` |
| **Region / account** | `us-east-1` / `975049954782` |

Nginx on the EC2 proxies `efestos.international` → container port 3001. The container listens on 3000; host-side mapping is `127.0.0.1:3001:3000`.

## Deploy flow

### Step 1 — Build and push image (CodeBuild pipeline)

Use the CodePipeline (auto-triggers on push to `main`) or trigger manually:

```powershell
aws codepipeline start-pipeline-execution --name hephaestus-international-pipeline --region us-east-1
```

The pipeline runs `hephaestus-international-build` → `hephaestus-international-deploy`. The buildspec pushes two ECR tags:
- `git-<12-char-sha>` — immutable, for audit
- `latest` — what the EC2 Docker Compose pulls

### Step 2 — Update EC2 container

After the pipeline succeeds, pull the new image on the EC2 via SSM Run Command:

```powershell
aws ssm send-command --region us-east-1 `
  --instance-ids "i-0292b7ec02f26a25b" `
  --document-name "AWS-RunShellScript" `
  --parameters 'commands=["aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 975049954782.dkr.ecr.us-east-1.amazonaws.com && cd /opt/hosting && docker compose pull hephaestus && docker compose up -d hephaestus"]'
```

Poll for completion:

```powershell
aws ssm get-command-invocation --region us-east-1 `
  --command-id <CommandId> `
  --instance-id "i-0292b7ec02f26a25b" `
  --query '{Status:Status,Output:StandardOutputContent}'
```

### Step 3 — Verify

```powershell
Invoke-RestMethod https://efestos.international/api/health
# Should return ok=true with the new commitSha
```

## Deployment proof standard

A deployment is proven when:

1. CodeBuild build succeeded and `latest` ECR tag updated
2. SSM Run Command completed with `Success`
3. `GET https://efestos.international/api/health` returns `"ok":true` with matching `commitSha`

## Runtime secret source of truth

Env vars are baked into the Docker image at CodeBuild time from **AWS SSM**:

| SSM Parameter | Runtime env var |
|---|---|
| `/flolabs-chronos/DATABASE_URL` | `DATABASE_URL`, `CHRONOS_DB_DATABASE_URL`, `FL_CHRONOS_DATABASE_URL` |
| `/hephaestus-international/CHRONOS_SYNC_API_URL` | `CHRONOS_SYNC_API_URL` |
| `/hephaestus-international/CHRONOS_SYNC_TOKEN` | `CHRONOS_SYNC_TOKEN` |
| `/hephaestus-international/CONTENT_STRAPI_URL` | `CONTENT_STRAPI_URL`, `NEXT_PUBLIC_STRAPI_URL` |
| `/hephaestus-international/STRAPI_API_TOKEN` | `STRAPI_API_TOKEN` |
| `/hephaestus-international/CONTENT_STRAPI_API_TOKEN` | `CONTENT_STRAPI_API_TOKEN` |
| `/flolabs-chronos/RESEND_API_KEY` | `RESEND_API_KEY` |
| `/flolabs-chronos/EMAIL_FROM` | `EMAIL_FROM` |
| `/flolabs-chronos/OPENAI_API_KEY` | `OPENAI_API_KEY` |

Additional runtime config is in `/opt/hosting/hephaestus.env` on the EC2 (sourced from S3: `s3://flolabs-chronos-backups/hosting-ec2/hephaestus.env`).

## Files that define the deploy path

- `buildspec.yml` — CodeBuild pipeline (builds image, pushes `git-<sha>` + `latest` to ECR)
- `FloLabs_Hermes/hosting-ec2-userdata.sh` — EC2 bootstrap (first-time setup only)
