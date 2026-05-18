# hephaestus-international URL routing progress

> **ARCHIVED / HISTORICAL** — this document is a completed agent worklog from 2026-04-30 to 2026-05-01 describing the DNS cutover from Vercel to AWS App Runner for `efestos.international` and `hephaestus.international`. The migration is complete: both domains are live, active, and pointing to App Runner. This file is kept for audit/historical reference only. **For current domain status, see `DOMAIN_SETUP_GUIDE.md`.**

---

Owner: Oliver / main OpenClaw assistant
Started: 2026-04-30 Europe/Paris
Scope: Route hephaestus-international URLs via Dynadot/hosting provider until intended URLs resolve and serve correctly.

## Protocol
- Agents append timestamped progress here every few minutes while working.
- Do not include secrets, raw credentials, cookies, or private tokens.
- Validate live DNS/HTTPS only; record commands and evidence.

## Updates

## 2026-04-30T20:20+02:00 - main orchestrator
- Started routing workstream and will delegate execution to subagents.
- Credentials/source context are in workspace files; secrets must not be copied here.
- Next: discover current DNS/hosting state, update Dynadot if needed, then verify URLs.

## 2026-04-30T20:44+02:00 - main orchestrator
- Oliver clarified defaults: one agent per repository, 5-minute WhatsApp updates, include URL health and WhatsApp session health.
- Updated durable defaults in `/mnt/c/Users/olire/Documents/workspace_python/CORE_DIRECTIVES.md` and `AGENTS.md` so future sessions inherit this behavior.
- Updated the cron monitor to check routing progress files, URL DNS/HTTPS health, and WhatsApp session health every 5 minutes.
- Next: spawn focused hephaestus-international and Chronos repo agents and steer/replace the earlier combined agent if needed.

## 2026-04-30T20:46+02:00 - hephaestus-url-routing-agent
- Started focused routing pass from repo root. Docs indicate intended domains: `hephaestus.international` primary and `efestos.international` secondary; newer deployment docs point frontend to AWS App Runner, older domain guide mentions Vercel.
- Found workspace Dynadot/AWS credentials but did not record secrets.
- Next: identify live App Runner target and current DNS/HTTPS.

## 2026-04-30T21:03+02:00 - main orchestrator
- Oliver requested reroute from old Vercel hosting to the new AWS App Runner version, while Chronos remains top priority.
- Current live evidence before new agent run: App Runner default URL `/api/health` returns 200; `hephaestus.international` and related domains return 200 but DNS currently appears Vercel/other-hosting oriented, not AWS App Runner.
- Spawned focused `hephaestus-aws-reroute-fix` execution agent and `routing-judge-council` review agent.
- Monitor changed to silent safety mode: no routine WhatsApp updates unless complete or blocked.

## 2026-04-30T21:48+02:00 - routing-judge-council
- Read-only council review completed; no DNS/App Runner changes made.
- Live evidence: AWS App Runner service `hephaestus-international` is running at `https://fykgssqbvg.us-east-1.awsapprunner.com`; `/api/health` returns 200 with commit `df445fe9...`. App Runner currently has no custom domains. Existing public domains still point to legacy/Vercel-style targets: apex `hephaestus.international` -> `216.150.1.1`, `www.hephaestus.international` -> `cname.vercel-dns.com`/Vercel and has TLS mismatch, `efestos.international` -> `76.76.21.21`, `www.efestos.international` -> Vercel.
- Recommended action: associate App Runner custom domains for `hephaestus.international` with `EnableWWWSubdomain=true`; if `efestos.international` remains required, add it as a second custom domain with `EnableWWWSubdomain=true`. Then add the ACM validation CNAMEs App Runner returns. Route apex records to `fykgssqbvg.us-east-1.awsapprunner.com` using Dynadot/provider ALIAS/ANAME/CNAME-flattening equivalent, and route `www` records as CNAMEs to `fykgssqbvg.us-east-1.awsapprunner.com`.
- Risk checks: adding App Runner custom domains before changing DNS minimizes downtime and gives validation records first. Do not leave mixed Vercel/App Runner records after cutover, or SSL/host behavior will differ by hostname. After custom domains are active, consider updating/redeploying App Runner env `APP_URL`/`NEXTAUTH_URL` from default App Runner URL to canonical public domain if auth callbacks depend on it.
- Success criteria: `aws apprunner describe-custom-domains` for hephaestus shows all intended domains `active` with validation `SUCCESS`; `curl -fsS https://hephaestus.international/api/health`, `https://www.hephaestus.international/api/health`, `https://efestos.international/api/health`, and `https://www.efestos.international/api/health` return 200 with non-null AWS commit metadata; root pages load over valid TLS and domain-specific branding remains correct.

## 2026-04-30T21:51+02:00 - hephaestus-aws-reroute-fix
- Confirmed intended domains from repo docs/config: `hephaestus.international`, `www.hephaestus.international`, `efestos.international`, `www.efestos.international`.
- Verified AWS App Runner service `hephaestus-international` is `RUNNING` at `fykgssqbvg.us-east-1.awsapprunner.com`; `/api/health` on the App Runner URL returns 200 with commit `df445fe933e2...` and image tag `git-df445fe933e2`.
- Associated `hephaestus.international` and `efestos.international` with the App Runner service using AWS CLI with WWW subdomain enabled. App Runner now reports both custom domains as `pending_certificate_dns_validation`.
- Current public DNS/HTTPS still serves Vercel: apex domains resolve to Vercel-oriented A records, `www.*` points to `cname.vercel-dns.com`, and `/api/health` responses have `server: Vercel` plus null deployment metadata.
- DNS work is blocked on Dynadot control/API credentials not present in the repo, shell environment, obvious local config, or memory search. Required DNS updates are below; values are public AWS validation/target records, not secrets.

Required Dynadot DNS changes:
- Routing target for `www.hephaestus.international`: replace CNAME `cname.vercel-dns.com` with CNAME `fykgssqbvg.us-east-1.awsapprunner.com`.
- Routing target for `www.efestos.international`: replace CNAME `cname.vercel-dns.com` with CNAME `fykgssqbvg.us-east-1.awsapprunner.com`.
- Routing target for apex `hephaestus.international`: replace Vercel A records with an ALIAS/ANAME/flattened-CNAME to `fykgssqbvg.us-east-1.awsapprunner.com` if Dynadot supports it; if not, apex routing needs a different DNS provider/Route53 delegation or an approved fallback redirect strategy.
- Routing target for apex `efestos.international`: same as above, target `fykgssqbvg.us-east-1.awsapprunner.com`.
- ACM/App Runner validation CNAMEs:
  - `_e26f59d52f9dcf73616d19b693298306.hephaestus.international` -> `_c6f664e71c4228918056db0ce12e8a2c.jkddzztszm.acm-validations.aws`
  - `_bbef3008edd189f25f3f50916548e6f9.www.hephaestus.international` -> `_0dc60c7fecc4bceb73a6e03a3a71d941.jkddzztszm.acm-validations.aws`
  - `_c341f988c528dedbd653763c8ab91632.r4j8dbu7ws54ykbkc04hgspp72g349u.hephaestus.international` -> `_ee924e39768b94f44bf1efebdec5b40e.jkddzztszm.acm-validations.aws`
  - `_50a6628d8222e5849e22aa6035fdfe66.efestos.international` -> `_e31923b25000acf637745979caf190f6.jkddzztszm.acm-validations.aws`
  - `_28d5f6d9579c153fe0d577e48b81244e.zvgkvnnt9ihvad6mane41zpsi0aonh7.efestos.international` -> `_326a7e8bb0e79733d169bbee6cd16cd9.jkddzztszm.acm-validations.aws`
  - `_f5807ee15de318ae9045164c18016694.www.efestos.international` -> `_f7a2f4b42be36a99bbce8f14ae525159.jkddzztszm.acm-validations.aws`

## 2026-04-30T22:06+02:00 - dynadot-dns-cutover-agent
- Attempted Dynadot DNS cutover using credentials from `WORKSPACE.md` without recording secrets. Dynadot web login is currently blocked by Cloudflare Turnstile/verification failure in headless browser; direct form login stopped returning an authenticated session, and API probes with available credential fields returned `invalid key` (no API key available). No Dynadot DNS changes were made.
- Current AWS App Runner state: `hephaestus.international` and `efestos.international` remain `pending_certificate_dns_validation`; all six ACM validation records are still `PENDING_VALIDATION` because public DNS does not yet contain them.
- Public DNS/HTTPS remains legacy/Vercel-oriented: `hephaestus.international` and `efestos.international` apex health endpoints return 200 with null deployment metadata; `www.hephaestus.international` fails TLS name verification; `www.efestos.international` still returns the legacy/Vercel-style health response.
- App Runner default `https://fykgssqbvg.us-east-1.awsapprunner.com/api/health` returns 200 with AWS commit metadata (`df445fe933e2...`).
- Next unblock: manually solve Dynadot login verification or provide a Dynadot API key/session; then apply the DNS changes listed in the previous 21:51 update (routing apex/www to `fykgssqbvg.us-east-1.awsapprunner.com` plus all six ACM validation CNAMEs).

## 2026-05-01T02:38+02:00 - main orchestrator propagation monitor
- AWS App Runner custom domains `hephaestus.international` and `efestos.international` are now `active`; all six certificate validation records are `SUCCESS`.
- Strict TLS health is still propagating: apex Hephaestus/Efestos currently present App Runner wildcard certs; `www.hephaestus.international` and `www.efestos.international` still present legacy Let's Encrypt certs or app responses. Continue monitoring until all intended URLs pass strict TLS and `/api/health`.

## 2026-05-01T02:52+02:00 - main orchestrator live validation
- Browser/Dynadot session is usable and DNS records are visible in Dynadot.
- AWS App Runner service `hephaestus-international` is RUNNING; custom domains `hephaestus.international` and `efestos.international` are `active`; all validation records are `SUCCESS`.
- Dynadot authoritative DNS now routes apex records via ANAME to `fykgssqbvg.us-east-1.awsapprunner.com`; `www.hephaestus.international` and `www.efestos.international` are CNAMEs to the same App Runner target.
- Strict TLS health is partly propagated: `www.efestos.international/api/health` returns 200 with AWS commit `df445fe9...`; `hephaestus.international`, `www.hephaestus.international`, and `efestos.international` still fail strict hostname verification on some edge IPs / recursive-cache paths, so keep monitoring until App Runner TLS edge propagation and public resolvers converge.

## 2026-05-01T02:59:04+02:00 - main orchestrator strict health follow-up
- `www.hephaestus.international/api/health` and `www.efestos.international/api/health` pass strict TLS and return 200 with AWS commit `df445fe9...`.
- `hephaestus.international/api/health` currently resolves through sampled legacy IP `216.150.1.1` and returns 404 despite authoritative Dynadot DNS being updated; likely recursive DNS cache still stale.
- `efestos.international/api/health` still fails strict TLS with App Runner wildcard certificate mismatch from sampled edge IP `34.201.85.189`.

## 2026-05-01T03:34+02:00 - main orchestrator blocker evidence
- App Runner custom domains remain `active` with all certificate validations `SUCCESS`.
- DNS now resolves apex and `www` Hephaestus/Efestos hostnames to the App Runner target IP set; `www.hephaestus.international` and `www.efestos.international` strict TLS `/api/health` return 200 with AWS commit metadata.
- Blocker: apex `hephaestus.international` and `efestos.international` still do not serve the App Runner health endpoint under strict production validation. They currently return 404 or stale/non-App-Runner certificate behavior even though AWS custom-domain validation is complete.

## 2026-05-01T07:04+02:00 - final routing validation
- AWS App Runner custom domain status: `hephaestus.international` and `efestos.international` are `active`; all certificate validation records are `SUCCESS`.
- Fresh public DNS validation via 1.1.1.1 plus strict TLS succeeds for Hephaestus/Efestos apex and www: `https://hephaestus.international/api/health`, `https://www.hephaestus.international/api/health`, `https://efestos.international/api/health`, and `https://www.efestos.international/api/health` all return 200 with App Runner commit `df445fe9...`.
