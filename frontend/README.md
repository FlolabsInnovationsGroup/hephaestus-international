# Hephaestus — Frontend

Next.js 16 App Router frontend. This directory is the Docker build context.

---

## Quick start

### Prerequisites

- Node.js 18–22
- `.env.local` configured (see below)

### Install

```bash
npm install
```

### Environment variables

Create `.env.local` in this directory:

```env
# Content Strapi — internship listings, blog posts, projects
CONTENT_STRAPI_URL=https://your-content-strapi.example.com
CONTENT_STRAPI_API_TOKEN=your-content-strapi-api-token

# Optional: main Strapi for site settings / team pages
NEXT_PUBLIC_STRAPI_URL=https://your-main-strapi.example.com
STRAPI_API_TOKEN=your-main-strapi-api-token
```

Production secrets are in AWS SSM; see `DEPLOYMENT.md`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

---

## Stack

- **Next.js 16** — App Router, RSC, ISR
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4**
- **Framer Motion** — animations on selected components

---

## Project structure

```
app/
├── page.tsx                 # Home
├── login/
├── me/
│   ├── application/         # Applicant dashboard
│   └── hr/                  # HR dashboard
├── profile/
├── api/
│   ├── admin/leads/         # HR lead management APIs
│   ├── applications/        # Applicant CRUD APIs
│   └── health/
components/
lib/
├── application-data.ts      # ApplicantStatus type (source of truth)
├── application-db.ts        # All DB access
├── application-store.ts     # Login gate
├── chronos-sync.ts          # Chronos access grant/revoke
└── strapi.ts                # Strapi fetch helpers
```

---

## Deployment

Primary: AWS CodeBuild (`buildspec.yml`). Fallback: GitHub Actions (`.github/workflows/deploy-aws-apprunner.yml`).

See `DEPLOYMENT.md` for the full pipeline and verification commands.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Build fails | `rm -rf .next && npm run build` |
| Type errors | `npx tsc --noEmit` from this directory |
| Stale content | ISR delay (~60s); content published in Strapi; valid tokens |
| Images blocked | `next.config.ts` remotePatterns; correct Strapi base URL |
