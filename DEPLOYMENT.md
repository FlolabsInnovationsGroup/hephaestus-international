# Hephaestus deployment workflow

## Production stack

| Item | Value |
|---|---|
| **Production domain** | `https://efestos.international` |
| **EC2 instance** | `i-0292b7ec02f26a25b` (`44.195.108.173`, `us-east-1`) |
| **Docker Compose dir** | `/opt/hosting/` |
| **ECR repository** | `975049954782.dkr.ecr.us-east-1.amazonaws.com/hephaestus-international` |
| **CodePipeline** | `hephaestus-international-pipeline` (auto-triggers on push to `main`) |
| **CodeBuild project** | `hephaestus-international-deploy` |
| **Region / account** | `us-east-1` / `975049954782` |

Nginx on the EC2 proxies `efestos.international` → container port 3001 (`127.0.0.1:3001:3000`).

## Deploy flow

### Normal path — push to main

```bash
git push origin main
```

This triggers `hephaestus-international-pipeline`, which runs CodeBuild. The build:

1. Reads `CONTENT_STRAPI_URL` from SSM (baked in as `NEXT_PUBLIC_STRAPI_URL` at build time)
2. Builds the Docker image from `./frontend`, tagging it `git-<12-char-sha>` and `latest`
3. Pushes both tags to ECR
4. SSMs into the EC2 to: ECR login → `docker image prune -f` → pull `:latest` → `docker compose up -d --force-recreate hephaestus`
5. Polls `https://efestos.international/api/health` until `"ok":true` with the new `commitSha`

Build succeeds = container is live with the pushed commit.

### Manual pipeline trigger

```bash
aws codepipeline start-pipeline-execution --name hephaestus-international-pipeline --region us-east-1
```

### Manual EC2 update (if pipeline post_build fails)

```bash
aws ssm send-command \
  --instance-ids "i-0292b7ec02f26a25b" \
  --document-name "AWS-RunShellScript" \
  --region us-east-1 \
  --parameters '{"commands":[
    "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 975049954782.dkr.ecr.us-east-1.amazonaws.com",
    "docker image prune -f",
    "docker pull 975049954782.dkr.ecr.us-east-1.amazonaws.com/hephaestus-international:latest",
    "cd /opt/hosting && docker compose up -d --force-recreate hephaestus"
  ]}'
```

Poll the command status:

```bash
aws ssm get-command-invocation \
  --command-id <CommandId> \
  --instance-id "i-0292b7ec02f26a25b" \
  --region us-east-1 \
  --query '{Status:Status,Output:StandardOutputContent}'
```

## Verify

```bash
curl -s https://efestos.international/api/health
# Expected: {"ok":true,"commitSha":"<sha>", ...}
```

A deployment is proven when `"ok":true` and `"commitSha"` matches the pushed commit.

## Runtime secrets

Runtime env vars come from `/opt/hosting/hephaestus.env` on the EC2 at container start (sourced from `s3://flolabs-chronos-backups/hosting-ec2/hephaestus.env`). The only exception is `NEXT_PUBLIC_STRAPI_URL`, which is baked into the image at build time from SSM `/hephaestus-international/CONTENT_STRAPI_URL`.

## Files that define the deploy path

- `buildspec.yml` — CodeBuild pipeline (build image, push to ECR, SSM deploy to EC2)
- `FloLabs_Hermes/hosting-ec2-userdata.sh` — EC2 bootstrap (first-time setup only)
