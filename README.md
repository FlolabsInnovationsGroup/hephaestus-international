# Hephaestus.International

Modern marketing site and content hub for **Hephaestus.International** (with optional **Efestos** branding on a second domain). The stack is **Next.js** (App Router) on the frontend and **Strapi v5** for content, with media on **Cloudinary** and deployments on **Vercel** (frontend) and **Railway** (Strapi + PostgreSQL).

**بالعربية:** المشروع عبارة عن موقع وواجهة أمامية بـ Next.js تتصل بنظامي Strapi (رئيسي للمحتوى العام للموقع، وآخر للمشاريع والمدونة وإعلانات التدريب)، مع دعم اسم تجاري يعتمد على النطاق (Hephaestus أو Efestos)، وإعادة تحقق للمحتوى (ISR) على معظم الصفحات.

---

## Architecture

| Layer | Role |
|--------|------|
| **Frontend** (`frontend/`) | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| **Main Strapi** | Site settings, homepage sections, benefits, methodology, team, verticals, etc. |
| **Content Strapi** | Projects, blog posts, internship listings (job posts) |
| **Media** | Cloudinary (via Strapi upload provider); Next.js allows remote images from Strapi and Cloudinary |

The homepage uses **server-side rendering with host-based branding** (`dynamic = 'force-dynamic'`). Most other routes use **ISR with a 60-second revalidation** window so CMS updates appear quickly without redeploying.

---

## Main routes

| Path | Description |
|------|-------------|
| `/` | Homepage (sections from main Strapi, projects from content Strapi) |
| `/about` | About |
| `/projects` | Projects listing |
| `/internships` | Internships list + search |
| `/internships/[slug]` | Internship detail + HubSpot form (form ID from CMS) |
| `/blogs` | Blog listing |
| `/blogs/[slug]` | Blog post |
| `/contact` | Contact (uses site settings from Strapi) |

---

## Branding (multi-domain)

Branding is resolved from the request host (`frontend/lib/branding.ts`):

- **Hephaestus** — default for `localhost` and `hephaestus.*` domains  
- **Efestos** — when the host contains `efestos`

Copy and metadata can use `getServerBrand()` so the same deployment can serve different institute names on different domains.

---

## Repository layout

```text
frontend/          # Next.js app (primary entry for local dev)
strapi/app/        # Strapi 5 CMS (schema, APIs, admin)
scripts/           # Utilities (content sync, etc. — see scripts/README.md)
```

---

## Prerequisites

- **Node.js** 18–22 (see `strapi/app/package.json` engines)
- API tokens for Strapi (from your team or Railway/Vercel env)

---

## Local development

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` from `frontend/.env.example` (do not commit secrets):

```env
NEXT_PUBLIC_STRAPI_URL=https://your-main-strapi.example.com
STRAPI_API_TOKEN=<main-strapi-api-token>

CONTENT_STRAPI_URL=https://your-content-strapi.example.com
CONTENT_STRAPI_API_TOKEN=<content-strapi-api-token>
```

In development, both URLs may point to the same Strapi instance if your deployment supports it; production often uses two instances as described in `frontend/README.md`.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Strapi (optional)

Only when changing schemas, plugins, or running the admin locally:

```bash
cd strapi/app
npm install
npm run develop
```

Admin UI: [http://localhost:1337/admin](http://localhost:1337/admin). Configure `DATABASE_URL` and other secrets per `strapi/app/.env.example`.

---

## Scripts

| Command | Where |
|---------|--------|
| `npm run dev` / `build` / `start` / `lint` | `frontend/` |
| `npm run develop` / `build` / `start` | `strapi/app/` |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [frontend/README.md](./frontend/README.md) | Frontend env vars, dual Strapi behavior, ISR |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Developer setup and patterns |
| [CMS_USER_GUIDE.md](./CMS_USER_GUIDE.md) | Content editing in Strapi |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Deployment (Vercel, Railway) |
| [DOMAIN_SETUP_GUIDE.md](./DOMAIN_SETUP_GUIDE.md) | DNS and domains |
| [QUICK_START.md](./QUICK_START.md) | Short onboarding |
| [QA_CHECKLIST.md](./QA_CHECKLIST.md) | Pre-release checks |
| [REBRAND_SUMMARY.md](./REBRAND_SUMMARY.md) | Hephaestus rebrand notes |
| [scripts/README.md](./scripts/README.md) | Scripts folder |

---

## Environment variables (summary)

### Frontend

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_STRAPI_URL` | Main Strapi base URL (public) |
| `STRAPI_API_TOKEN` | Server-only token for main Strapi |
| `CONTENT_STRAPI_URL` | Content Strapi base URL (server-only) |
| `CONTENT_STRAPI_API_TOKEN` | Server-only token for content Strapi |

Never prefix secret tokens with `NEXT_PUBLIC_`.

### Strapi (Railway / self-hosted)

Typical values include `DATABASE_URL`, `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, and Cloudinary/transfer settings as required by your Strapi config. See `DEPLOYMENT_GUIDE.md` and `strapi/app/.env.example`.

---

## Features

- **Content**: Strapi v5 REST APIs with bearer tokens; optional split between “main” and “content” backends  
- **Performance**: ISR (~60s) on listing and detail pages; optimized images via Next.js image config  
- **Forms**: HubSpot embedded forms on internship pages (`portalId` default in `hubspot-form.tsx`; per-role `formId` from CMS)  
- **Media**: Cloudinary + Strapi; `next.config.ts` allows Strapi and Cloudinary hostnames  

---

## Troubleshooting

- **Stale content**: Wait up to ~60 seconds for ISR, or confirm items are **Published** in Strapi.  
- **Missing projects/internships**: Ensure `CONTENT_STRAPI_URL` / `CONTENT_STRAPI_API_TOKEN` are set and match the content instance.  
- **Images**: Check `NEXT_PUBLIC_STRAPI_URL`, `CONTENT_STRAPI_URL`, and Cloudinary hostnames in `frontend/next.config.ts`.  
- **Build failures**: Verify all required env vars in Vercel; ensure Strapi is reachable at build time if pages fetch during build.

---

## License

Specify license in this repository as decided by your organization.

---

**Last updated:** April 2026  

Maintained by Flo Labs / Hephaestus.International development.
