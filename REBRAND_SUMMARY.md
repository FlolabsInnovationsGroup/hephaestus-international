# Rebrand Summary (Historical)

> **This is an archival document.** It records the one-time rebrand from "Flo Labs International" to "Hephaestus / Efestos" that was completed before the platform was converted into the current internship applicant tracking system. The architecture described here (Vercel, Railway, WordPress migration) no longer reflects the current system.
>
> **For current architecture, read `ARCHITECTURE.md`.** The platform now runs on AWS App Runner with a shared RDS PostgreSQL database and a 14-stage HR pipeline.

---

## What the Rebrand Was

In an earlier phase, this repo was a marketing website built on Next.js + Strapi, hosted on Vercel (frontend) and Railway (Strapi CMS). The rebrand replaced "Flo Labs International" branding with "Hephaestus / Efestos" across all copy, metadata, and configuration.

## Brand Changes Applied at the Time

### Primary Replacements
1. "Flolabs International" → "Hephaestus.International"
2. "Flo Labs International" → "Hephaestus.International"
3. "flolabs.international" → "hephaestus.international"
4. "flolabsinternational" → "hephaestus-international"
5. "FLO LABS R&D" → "HEPHAESTUS R&D"
6. "FLO LABS" → "HEPHAESTUS"

### Preserved References
- "A Flo Labs Company" — footer attribution kept
- "Flo Labs R&D" — footer link kept

## Content Migration (Completed)

WordPress internship data (39 entries) was migrated to Strapi using the scripts in `scripts/`. This migration is complete. The scripts are kept in git history.

## Current State

The Vercel/Railway deployment is no longer active. The platform is now:
- Deployed on **AWS App Runner** (`https://fykgssqbvg.us-east-1.awsapprunner.com`)
- Custom domain: `https://efestos.international`
- Database: shared AWS RDS PostgreSQL with FloLabs Chronos
- Strapi is still running as an optional marketing CMS but is not required by the HR platform

See `ARCHITECTURE.md` and `DEPLOYMENT.md` for the current system.
