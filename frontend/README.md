# Hephaestus.International - Frontend

Next.js 16 frontend application for hephaestus.international, powered by Strapi CMS.

## Quick Start

### Prerequisites
- Node.js 18-20 (use `nvm use 20` if using nvm)
- Environment variables configured (see below)

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_STRAPI_URL=https://strapi-production-7ecb.up.railway.app
STRAPI_API_TOKEN=your-full-access-token
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Architecture

### Tech Stack
- **Next.js 16** (App Router) - React framework with SSR/SSG
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Animations
- **Axios** - HTTP client for Strapi API

### Key Features
- Server-side rendering (SSR) for dynamic content
- Static site generation (SSG) for internships and blogs
- 60-second ISR (Incremental Static Regeneration)
- HubSpot form integration for internship applications
- Optimized image loading with Next.js Image

### Project Structure

```
app/              # Next.js App Router pages
├── page.tsx      # Homepage
├── about/        # About page
├── internships/  # Internship list & detail pages
├── projects/     # Projects page
├── blogs/        # Blog list & detail pages
└── contact/      # Contact page

components/       # React components
├── header.tsx    # Navigation (client component)
├── footer.tsx    # Footer (server component)
├── hubspot-form.tsx  # HubSpot integration (client)
└── ...           # Other reusable components

lib/             # Utilities
├── strapi.ts    # Strapi API client functions
├── types.ts     # TypeScript interfaces
└── utils.ts     # Helper functions

public/          # Static assets
```

## API Integration

All content is fetched from Strapi CMS via `lib/strapi.ts`:

```typescript
import { getInternships, getProjects, getBlogPosts } from '@/lib/strapi'

// Fetch data in Server Components
const internships = await getInternships()
const projects = await getProjects()
const posts = await getBlogPosts()
```

### Available API Functions

- `getInternships(filters?)` - Fetch internships with optional filters
- `getInternshipBySlug(slug)` - Single internship by slug
- `getProjects()` - All projects sorted by order
- `getHomepageProjects()` - Only projects marked for homepage
- `getBlogPosts()` - All blog posts sorted by date
- `getBlogPostBySlug(slug)` - Single blog post
- `getStrapiImageUrl(url)` - Convert Strapi image URLs

## Development Guidelines

### Server vs Client Components

Use Server Components by default. Only add `'use client'` when you need:
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect, useRef)
- Browser APIs (window, localStorage)

**Client Components in this project:**
- `header.tsx` - Mobile menu interactivity
- `hubspot-form.tsx` - Form embedding with useEffect
- `button.tsx` - Click handlers
- `internship-carousel.tsx` - Image carousel state
- `projects-showcase.tsx` - Interactive filtering

### Revalidation

Add to pages that fetch from Strapi:

```typescript
export const revalidate = 60 // Revalidate every 60 seconds
```

### Static Generation

For dynamic routes, implement `generateStaticParams`:

```typescript
export async function generateStaticParams() {
  const items = await getItems()
  return items.map((item) => ({ slug: item.slug }))
}
```

### Image Optimization

Always use Next.js Image component:

```tsx
import Image from 'next/image'
import { getStrapiImageUrl } from '@/lib/strapi'

<Image
  src={getStrapiImageUrl(image.url)!}
  alt={image.alternativeText || ''}
  width={800}
  height={600}
/>
```

## Deployment

### Vercel (Production)

Auto-deploys from `main` branch.

**Environment Variables (set in Vercel dashboard):**
- `NEXT_PUBLIC_STRAPI_URL`
- `STRAPI_API_TOKEN`

### Manual Deployment

```bash
vercel deploy --prod
```

## Troubleshooting

### Build Fails

```bash
rm -rf .next
npm run build
```

### Data Not Updating

- Wait 60 seconds (ISR revalidation)
- Check content is Published in Strapi
- Verify STRAPI_API_TOKEN is valid

### Images Not Loading

- Check `next.config.ts` remote patterns
- Verify Strapi URL is correct
- Check browser console for errors

## Documentation

For detailed guides, see:
- **[DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)** - Comprehensive developer documentation
- **[.github/copilot-instructions.md](../.github/copilot-instructions.md)** - AI coding agent guide
- **[README.md](../README.md)** - Project overview

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run ESLint
```
