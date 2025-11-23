# Hephaestus.International - AI Coding Agent Instructions

## Project Architecture

This is a **headless CMS-powered website** migrated from WordPress, using:
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4
- **Backend**: Strapi v5.31.0 (self-hosted headless CMS on Railway)
- **Database**: PostgreSQL 16 on Railway
- **Deployment**: Vercel (frontend) + Railway (backend + DB)

### Directory Structure
```
frontend/          # Next.js application
├── app/          # App Router pages (SSG with 60s revalidation)
├── components/   # React components (client + server)
├── lib/          # Utilities (strapi.ts = API client, types.ts)
└── public/       # Static assets

strapi/app/       # Strapi CMS
├── src/api/      # Content types: internship, project, blog-post
│   ├── internship/        # 39 internships (title, slug, status, description, requirements, responsibilities, hubspotFormId)
│   ├── project/           # 8 projects (title, slug, description, link, order, images)
│   ├── blog-post/         # 13 blog posts (title, slug, author, content, publishedDate)
│   ├── benefit/           # Dynamic homepage benefits section
│   ├── vertical/          # Dynamic homepage verticals section
│   ├── methodology-item/  # Dynamic homepage methodology steps
│   ├── section-content/   # Dynamic page sections (identifier-based)
│   └── site-setting/      # Global site settings (single type)
├── config/       # Strapi configuration
└── database/     # PostgreSQL migrations

scripts/          # Data migration utilities
```

## Critical Development Patterns

### 1. Strapi API Integration
**All data comes from Strapi** via `lib/strapi.ts`. Never hardcode content in components.

```typescript
// Always use these helper functions from lib/strapi.ts
import { getInternships, getInternshipBySlug } from '@/lib/strapi'

// Fetch data in Server Components (app/ pages)
const internships = await getInternships()
const internship = await getInternshipBySlug(slug)
```

**Key API functions:**
- `getInternships(filters?)` - Fetch all internships with optional status/search filters
- `getInternshipBySlug(slug)` - Single internship by slug
- `getProjects()` - All projects sorted by `order:asc`
- `getBlogPosts()` - All blog posts sorted by `publishedDate:desc`
- `getStrapiImageUrl(url)` - Convert relative Strapi URLs to absolute

**Error Handling Pattern:**
All API functions use try-catch with graceful fallbacks:
```typescript
// Returns empty array on error, not throwing exceptions
try {
  const response = await fetchAPI(...)
  return response.data || []
} catch (error) {
  console.warn('Failed to fetch:', error)
  return []  // Graceful fallback
}
```

This prevents build failures if Strapi is temporarily unavailable. Pages render with empty content rather than crashing.

### 2. Revalidation Strategy
**60-second ISR (Incremental Static Regeneration)** for all dynamic pages:

```typescript
// Add to every page that fetches from Strapi
export const revalidate = 60
```

Content editors update Strapi → changes appear on site within 60 seconds. No manual rebuilds needed.

**Current pages with revalidation:**
- `/projects` - 60s revalidation
- `/about` - 60s revalidation  
- `/blogs` - 60s revalidation
- `/blogs/[slug]` - 60s revalidation

**Note:** Homepage (`page.tsx`) fetches data but relies on default Next.js caching. Consider adding `export const revalidate = 60` if homepage content becomes stale.

### 3. Static Generation with generateStaticParams
Dynamic routes pre-generate at build time:

```typescript
// In app/internships/[slug]/page.tsx
export async function generateStaticParams() {
  const internships = await getInternships()
  return internships.map((i) => ({ slug: i.slug }))
}
```

This pattern is used for `/internships/[slug]` and `/blogs/[slug]`.

### 4. Image Handling
Images live in Strapi's media library. Always use the helper:

```typescript
import { getStrapiImageUrl } from '@/lib/strapi'

// Convert Strapi URLs (relative or absolute)
const imageUrl = getStrapiImageUrl(image.url)

// Use Next.js Image component for optimization
<Image 
  src={imageUrl} 
  alt={image.alternativeText || ''} 
  width={800} 
  height={600} 
/>
```

**Image Configuration:** Remote image patterns are configured in `next.config.ts`:
- Production: `strapi-production-7ecb.up.railway.app` (HTTPS)
- Development: `localhost:1337` (HTTP)

**Important:** When adding new Strapi image sources, update `next.config.ts` remote patterns.

### 5. HubSpot Form Integration
Internship applications use embedded HubSpot forms:

```tsx
import { HubSpotForm } from '@/components/hubspot-form'

<HubSpotForm 
  formId={internship.hubspotFormId} 
  portalId="45023159"  // Flo Labs portal ID
/>
```

The `hubspotFormId` is stored in Strapi's internship content type. Each internship can have a unique form.

**Critical:** HubSpot script is loaded globally in `app/layout.tsx` using Next.js `<Script>` component with `strategy="lazyOnload"`. The form component waits for `window.hbspt` to be available before rendering.

### 6. Client vs Server Components
This project uses React Server Components (RSC) by default:

**Server Components** (default - no directive needed):
- All page components in `app/`
- Most components in `components/` (footer, hero, benefits, etc.)
- Can fetch data directly with `await`
- No useState, useEffect, or browser APIs

**Client Components** (require `'use client'` directive):
- `header.tsx` - Mobile menu interactivity
- `hubspot-form.tsx` - Form embedding with useEffect
- `button.tsx` - Click handlers
- `internship-carousel.tsx` - Image carousel with state
- `projects-showcase.tsx` - Interactive filtering

**Pattern:** Keep components as Server Components unless they need:
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect, useRef)
- Browser APIs (window, localStorage)
- Third-party libraries requiring client-side rendering

## Development Workflows

### Running Locally
```bash
# Frontend (http://localhost:3000)
cd frontend && npm install && npm run dev

# Strapi CMS (http://localhost:1337)
cd strapi/app && npm install && npm run develop
```

**Note:** You must use Node.js 18-20. If using nvm:
```bash
nvm use 20
nvm alias default 20  # Set as default
```

### Environment Variables
Frontend requires:
```env
NEXT_PUBLIC_STRAPI_URL=https://strapi-production-7ecb.up.railway.app
STRAPI_API_TOKEN=<full-access-token-from-strapi>
```

Strapi requires (Railway auto-provides these):
```env
DATABASE_URL=<railway-postgres-url>
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=<secret>
ADMIN_JWT_SECRET=<secret>
JWT_SECRET=<secret>
```

### Deployment
- **Frontend**: Push to `main` → Vercel auto-deploys
- **Strapi**: Push to `main` → Railway auto-deploys
- No manual build steps required

### Data Migration Scripts
Located in `scripts/`:
- `import-wordpress-to-strapi.js` - Import internships from WordPress XML
- `sync-missing-internships.js` - Sync missing internships to Strapi
- `import-blog-posts.js` - Import blog posts
- `upload-images-to-strapi.js` - Bulk upload media

Run with: `export STRAPI_API_TOKEN=<token> && node <script>.js`

## Common Tasks

### Adding a New Content Type
1. **In Strapi**: Content-Type Builder → Create collection
2. **Define schema** with required fields (title, slug, description, etc.)
3. **Create API function** in `frontend/lib/strapi.ts`:
   ```typescript
   export async function getNewContent(): Promise<NewContent[]> {
     const response = await fetchAPI<StrapiResponse<NewContent[]>>(
       '/new-contents?populate=*&sort=order:asc'
     )
     return response.data || []
   }
   ```
4. **Add TypeScript interface** in `frontend/lib/types.ts`
5. **Create pages** in `frontend/app/new-content/`

### Updating Component Patterns
- **Server Components** (default): Fetch data directly, no useState/useEffect
- **Client Components**: Use `'use client'` directive only when needed (forms, interactivity)
- **Layout Components**: `<Container>`, `<Section>` wrappers for consistent spacing
- **Styling**: Tailwind utility classes, custom color `#0047AB` (Flo blue)

### SEO Metadata
Every page exports `generateMetadata`:

```typescript
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Page Title | Flo Labs',
    description: 'Page description (max 160 chars)',
    openGraph: { title: '...', description: '...' }
  }
}
```

## Project-Specific Conventions

### Naming
- **Slugs**: kebab-case (e.g., `ai-research-intern`)
- **Files**: kebab-case for components, lowercase for directories
- **Components**: PascalCase exports

### Status Field Pattern
Internships use `status: 'Open' | 'Closed' | 'Filled'`. Filter in Strapi queries:

```typescript
const openInternships = await getInternships({ status: 'Open' })
```

### Array Data Handling
Strapi stores lists as `text` fields (newline-separated). Convert in components:

```typescript
const getArrayData = (data: string | undefined): string[] => {
  if (!data) return []
  return data.split('\n').map(line => line.trim()).filter(Boolean)
}
```

### Framer Motion for Animations
Imported but used sparingly. Prefer CSS transitions unless complex animations needed.

## Critical Files Reference

| File | Purpose |
|------|---------|
| `frontend/lib/strapi.ts` | **Core API client** - all Strapi interactions |
| `frontend/lib/types.ts` | TypeScript interfaces for Strapi content |
| `frontend/app/layout.tsx` | Root layout with Header/Footer |
| `strapi/app/src/api/internship/` | Internship content type definition |
| `scripts/sync-missing-internships.js` | Sync script (39 internships from WordPress) |

## Troubleshooting

### Data Not Updating
- Wait 60 seconds (revalidation period)
- Check content is **Published** in Strapi (not Draft)
- Verify `STRAPI_API_TOKEN` has correct permissions

### Build Failures
- Ensure all required env vars are set in Vercel
- Check Strapi is accessible at build time
- Clear Next.js cache: `rm -rf .next && npm run build`

### Missing Internships
- Run `scripts/sync-missing-internships.js` to sync from static data
- WordPress had 39 internships; verify Strapi has all of them
- Check Strapi admin: `/admin/content-manager/collection-types/api::internship.internship`

## Documentation Resources
- Full setup: `DEVELOPER_GUIDE.md`
- Migration history: `EXECUTIVE_SUMMARY.md`, `MIGRATION_STRATEGY.md`
- Script usage: `scripts/SYNC_INSTRUCTIONS.md`
- Content editing: `CMS_USER_GUIDE.md` (for non-technical users)
