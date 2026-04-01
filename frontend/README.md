# Hephaestus.International — Frontend

Next.js (App Router) frontend for **hephaestus.international**. Content is loaded from **two Strapi instances**: a **main** CMS for site-wide content and a **content** CMS for projects, blog posts, and internship job listings.

---

### نظرة عامة (عربي)

الواجهة مبنية بـ Next.js وتتصل بـ **Strapi رئيسي** (إعدادات الموقع، الأقسام، الفريق، …) و**Strapi للمحتوى** (المشاريع، المدونات، إعلانات التدريب). المتغيرات السرية تُقرأ من الخادم فقط ولا تُعرَّض للمتصفح. راجع قسم **Environment Variables** أدناه.

---

## Quick start

### Prerequisites

- Node.js 18–22 (e.g. `nvm use 20`)
- `.env.local` configured (see below)

### Install

```bash
npm install
```

### Environment variables

Create `.env.local` in this directory (see also `.env.example`):

```env
# Main Strapi — site settings, sections, team pages, benefits, methodology, etc.
NEXT_PUBLIC_STRAPI_URL=https://your-main-strapi.example.com
STRAPI_API_TOKEN=your-main-strapi-api-token

# Content Strapi — projects, blog posts, internship listings (job posts only)
CONTENT_STRAPI_URL=https://your-content-strapi.example.com
CONTENT_STRAPI_API_TOKEN=your-content-strapi-api-token
```

| Variable | Scope | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_STRAPI_URL` | Client + server | Base URL for **main** Strapi (public). |
| `STRAPI_API_TOKEN` | **Server only** | API token for main Strapi. |
| `CONTENT_STRAPI_URL` | **Server only** | Base URL for **content** Strapi (no `NEXT_PUBLIC_` prefix). |
| `CONTENT_STRAPI_API_TOKEN` | **Server only** | API token for content Strapi. |

Never commit real tokens. Do not prefix secret tokens with `NEXT_PUBLIC_`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Restart the dev server after changing `.env.local`.

### Production build

```bash
npm run build
npm start
```

---

## Architecture

### Tech stack

- **Next.js 16** — App Router, RSC, ISR
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4**
- **Framer Motion** — animations on selected components
- **Native `fetch`** — Strapi calls are implemented in `lib/strapi.ts` (no Axios usage in app code)

### Dual Strapi

| Area | Strapi | Helper (typical) |
|------|--------|------------------|
| Projects, homepage projects, project images | Content | `getProjects`, `getHomepageProjects`, `getContentStrapiImageUrl` |
| Blogs | Content | `getBlogPosts`, `getBlogPostBySlug`, `getContentStrapiImageUrl` |
| Internships (list + detail, `/api/internships`) | Content | `getInternships`, `getInternshipBySlug` |
| Site settings, sections, benefits, verticals, methodology, pages, **interns (people on About)** | Main | `fetchAPI`, `getStrapiImageUrl` |

Exported helpers in `lib/strapi.ts`:

- **`fetchAPI`** — main Strapi (internal).
- **`fetchContentAPI`** — content Strapi (exported for advanced use).
- **`getStrapiImageUrl`** — media URLs on the **main** instance.
- **`getContentStrapiImageUrl`** — media URLs for **projects / blogs** (and homepage project cards when resolved on the server).

The internships **listing page** loads data from **`GET /api/internships`** (client fetch); that route uses `getInternships({ status: 'Open' })` on the server. Content Strapi may expose status as `internship_status`; the client normalizes it to `status` in code.

### Features

- ISR / revalidation (often `revalidate = 60` on routes).
- HubSpot forms on internship detail pages when `hubspotFormId` is set.
- `next/image` with remote patterns driven by `NEXT_PUBLIC_STRAPI_URL` and `CONTENT_STRAPI_URL` in `next.config.ts`.

### Project structure

```
app/
├── page.tsx                 # Home
├── about/
├── contact/
├── projects/
├── blogs/                   # List + [slug]
├── internships/             # List (client) + [slug]
├── api/internships/route.ts # Open internships JSON for the list page
├── layout.tsx, globals.css, ...
components/                  # UI (header, footer, sections, …)
lib/
├── strapi.ts                # All Strapi types + fetch helpers
├── branding.ts
├── utils.ts
└── types.ts
public/
```

---

## API integration (`lib/strapi.ts`)

Server Components and route handlers import helpers as needed:

```typescript
import {
  getProjects,
  getBlogPosts,
  getInternships,
  getSiteSettings,
  getStrapiImageUrl,
  getContentStrapiImageUrl,
} from '@/lib/strapi'
```

Common functions:

- **Content Strapi:** `getInternships`, `getInternshipBySlug`, `getProjects`, `getHomepageProjects`, `getProjectById`, `getBlogPosts`, `getBlogPostBySlug`
- **Main Strapi:** `getTeamMembers`, `getPageBySlug`, `getSiteSettings`, `getBenefits`, `getVerticals`, `getMethodologyItems`, `getSectionContent`, `getInterns`, …

`getInterns` (people on the About page) uses the main Strapi `interns` collection. If that API returns **404** (collection missing), the app treats it as an empty list without breaking the page.

---

## Development notes

### Server vs client components

Prefer Server Components. Use `'use client'` only when you need events, hooks, or browser APIs. Examples: `header.tsx`, `hubspot-form.tsx`, `internships/page.tsx` (list + search), `projects-showcase.tsx`.

### Revalidation

```ts
export const revalidate = 60
```

### Dynamic routes

Use `generateStaticParams` where applicable (e.g. blog and internship slugs).

### Images

- Main Strapi media: `getStrapiImageUrl`
- Projects / blogs (content Strapi): `getContentStrapiImageUrl`
- Ensure hostnames are allowed in `next.config.ts` `images.remotePatterns`

---

## Deployment

Set the same four environment variables in your host (Vercel, Railway, etc.):

- `NEXT_PUBLIC_STRAPI_URL`
- `STRAPI_API_TOKEN`
- `CONTENT_STRAPI_URL`
- `CONTENT_STRAPI_API_TOKEN`

Redeploy after changing env vars.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Build fails | `rm -rf .next && npm run build` |
| Stale content | ISR delay (~60s); content published in Strapi; valid tokens |
| Images blocked | `next.config.ts` remotePatterns; correct Strapi base URL |
| Empty internships list | Content Strapi URL/token; entries published; `internship_status` / `status` for “Open” |
| About page / interns empty | Main Strapi may not expose `interns` — optional; page still loads |

---

## Scripts

```bash
npm run dev      # Development
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint
```

---

## More docs

- **[DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)** — broader developer guide (if present)
- **[README.md](../README.md)** — monorepo overview (if present)
