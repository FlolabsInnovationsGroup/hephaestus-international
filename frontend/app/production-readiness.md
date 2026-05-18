> **ARCHIVED / HISTORICAL** — this file recorded early-stage production blockers from the initial scaffolding phase. All listed blockers have been resolved. The platform is in production at `https://efestos.international`. See `ARCHITECTURE.md` for current state, including the Known Gaps section for outstanding items.

---

## Resolved (historical blockers)

- ~~applicant storage still file-backed, not database-backed~~ — resolved: `APPLICANT_STORAGE_DRIVER=postgres` is set at deploy time; all applicant data is stored in `flolabs_users` on Neon PostgreSQL
- ~~Chronos sync not fully verified end-to-end in deployed env~~ — resolved: shared Neon DB is live; `grantChronosAccess()` / `revokeChronosAccess()` are production-verified
- ~~live production secrets/env not confirmed for Blob/OpenAI/Chronos sync/Strapi content~~ — resolved: all secrets in AWS SSM, fetched at deploy time via `buildspec.yml`
- ~~Paula not connected to exact Emails_automation stack~~ — partially resolved: Paula uses `OPENAI_API_KEY` from SSM; falls back to rule-based replies when absent; not yet wired to the Emails_automation Lambda backend
- ~~no real durable admin audit trail or workflow history~~ — partially resolved: `website_applicant_stage_transitions` logs every stage change with timestamp; no HR-visible UI for the audit log yet

## Still open (see ARCHITECTURE.md Known Gaps)

- Real CV file upload/storage: API stubs exist but end-to-end S3/object store is incomplete
- Paula not yet wired to the Emails_automation backend (uses OpenAI direct or rule-based fallback)
