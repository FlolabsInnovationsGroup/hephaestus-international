# Domain Setup — efestos.international

## Current State

The domain `efestos.international` is **already live and operational**. It is configured as a custom domain on the AWS App Runner service `hephaestus-international`.

| | |
|---|---|
| Production domain | `https://efestos.international` |
| AWS App Runner URL | `https://fykgssqbvg.us-east-1.awsapprunner.com` |
| App Runner service ARN | `arn:aws:apprunner:us-east-1:975049954782:service/hephaestus-international/7b3d7cb4f0894c21ae16f15b985fedc7` |

Both URLs serve the same App Runner service. The custom domain is a DNS alias — no separate deployment exists.

---

## How It Works

App Runner custom domains use a CNAME in the registrar's DNS pointing to the App Runner service URL. SSL is managed automatically by App Runner via ACM (AWS Certificate Manager).

The `NEXTAUTH_URL` env var is set to the AWS URL (`https://fykgssqbvg.us-east-1.awsapprunner.com`) for auth callbacks; the custom domain works transparently on top.

---

## Verify Domain Health

```bash
curl -s https://efestos.international/api/health
# Should return: { "ok": true, "commitSha": "...", ... }

# Compare with the App Runner URL
curl -s https://fykgssqbvg.us-east-1.awsapprunner.com/api/health
```

Both should return the same `commitSha`.

---

## Checking Domain Status in App Runner

```bash
aws apprunner describe-custom-domains \
  --service-arn arn:aws:apprunner:us-east-1:975049954782:service/hephaestus-international/7b3d7cb4f0894c21ae16f15b985fedc7 \
  --region us-east-1
```

---

## If the Domain Stops Working

1. Check App Runner service status: `aws apprunner describe-service --service-arn <arn> --region us-east-1`
2. Verify the service is `RUNNING` and the image tag matches the latest deploy
3. Check DNS propagation if the domain was recently reconfigured
4. Check the custom domain association in the App Runner console

The AWS App Runner URL (`fykgssqbvg.us-east-1.awsapprunner.com`) is always the authoritative fallback — it does not depend on DNS.
