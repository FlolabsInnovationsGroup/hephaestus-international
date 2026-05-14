# Testing — Hephaestus International

This repo’s **canonical QA and Playwright instructions** live in [`QA_CHECKLIST.md`](./QA_CHECKLIST.md). Read that file first for deploy gates, HR smoke checks, and shared `flolabs_users` verification.

## Quick commands

From `hephaestus-international` (repo root, where `playwright.config.ts` lives):

```bash
npx playwright install chromium
npx playwright test --config playwright.config.ts
```

`PLAYWRIGHT_BASE_URL` overrides the default App Runner URL. Credentials and optional `baseUrl` come from `test_assets/test_users.json`.

## Chronos (shared identity)

Chronos documents production Playwright flows in its own [`FloLabs_Chronos/TESTING.md`](../FloLabs_Chronos/TESTING.md). After identity or migration work, run Chronos live tests if timer/session surfaces are touched.

## HubSpot CSV → `flolabs_users` (admin)

HR can POST the HubSpot “all contacts” export to:

`POST /api/admin/contacts/hubspot-csv-sync`

multipart field **`file`** (CSV). Requires an HR session (`hr_binary_role`). Large files are bounded by `HUBSPOT_CSV_SYNC_MAX_BYTES` / `HUBSPOT_CSV_SYNC_MAX_ROWS` on the server.

For full historical merges (legacy Hephaestus table + very large CSV), use the Chronos script (same database):

`FloLabs_Chronos` → `pnpm run db:merge:contacts` (see Chronos `package.json` and script header comments).
