# Developer Guide - Flo Labs Website

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **Backend CMS**: Strapi v5.31.0 (Headless CMS)
- **Database**: PostgreSQL 16 on Railway
- **Hosting**: 
  - Frontend: Vercel
  - Backend: Railway (Strapi + PostgreSQL)

### Project Structure
```
hephaestus-international/
├── frontend/               # Next.js application
│   ├── app/               # App Router pages
│   │   ├── page.tsx       # Homepage
│   │   ├── about/         # About page
│   │   ├── internships/   # Internships list & detail
│   │   ├── projects/      # Projects page
│   │   ├── blogs/         # Blog list & detail
│   │   └── contact/       # Contact page
│   ├── components/        # React components
│   ├── lib/              # Utilities & API helpers
│   │   ├── strapi.ts     # Strapi API functions
│   │   └── types.ts      # TypeScript interfaces
│   └── public/           # Static assets
├── strapi/               # Strapi CMS application
│   └── app/
│       ├── config/       # Strapi configuration
│       ├── src/api/      # API endpoints & schemas
│       │   ├── internship/
│       │   ├── project/
│       │   └── blog-post/
│       └── database/     # Database migrations
└── scripts/              # Import/migration scripts
    ├── import-wordpress-to-strapi.js
    ├── import-blog-posts.js
    ├── create-projects.js
    └── upload-images-to-strapi.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- PostgreSQL (for local Strapi development)

### Initial Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/FlomadLabsRD/hephaestus-international.git
cd hephaestus-international
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_STRAPI_URL=https://strapi-production-7ecb.up.railway.app
STRAPI_API_TOKEN=your_api_token_here
```

#### 3. Run Frontend Locally
```bash
npm run dev
```
Frontend runs at: http://localhost:3000

#### 4. Strapi Setup (if needed)
```bash
cd strapi/app
npm install
```

Edit `.env`:
```env
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_URL=your_postgres_url
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your_token_salt
ADMIN_JWT_SECRET=your_admin_secret
TRANSFER_TOKEN_SALT=your_transfer_salt
JWT_SECRET=your_jwt_secret
```

#### 5. Run Strapi Locally
```bash
npm run develop
```
Strapi runs at: http://localhost:1337

---

## 📡 API Integration

### Strapi API Helper (`lib/strapi.ts`)

```typescript
import { getInternships, getInternshipBySlug } from '@/lib/strapi'

// Get all internships
const internships = await getInternships()

// Get single internship by slug
const internship = await getInternshipBySlug('ai-research-intern')

// Get all projects
const projects = await getProjects()

// Get all blog posts
const blogPosts = await getBlogPosts()

// Get single blog post
const post = await getBlogPostBySlug('future-of-ai')
```

### Available API Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `getInternships()` | Fetch all internships | `Internship[]` |
| `getInternshipBySlug(slug)` | Fetch single internship | `Internship \| null` |
| `getProjects()` | Fetch all projects | `Project[]` |
| `getBlogPosts()` | Fetch all blog posts | `BlogPost[]` |
| `getBlogPostBySlug(slug)` | Fetch single blog post | `BlogPost \| null` |

### TypeScript Interfaces

```typescript
// Internship
interface Internship {
  id: number
  documentId: string
  title: string
  slug: string
  status: 'Open' | 'Closed' | 'Filled'
  location: string
  duration?: string
  description: string
  requirements?: string
  responsibilities?: string
  hubspotFormId?: string
  images?: { url: string, alternativeText?: string }[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

// Project
interface Project {
  id: number
  documentId: string
  title: string
  slug: string
  description: string
  link?: string
  order: number
  images?: { url: string, alternativeText?: string }[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

// Blog Post
interface BlogPost {
  id: number
  documentId: string
  title: string
  slug: string
  content: string
  excerpt?: string
  author: string
  publishedDate: string
  tags?: string[]
  featuredImage?: { url: string, alternativeText?: string }
  createdAt: string
  updatedAt: string
  publishedAt?: string
}
```

---

## 🎨 Styling & Components

### Tailwind Configuration
Custom colors in `tailwind.config.ts`:
```typescript
colors: {
  'flo-blue': '#0047AB',
}
```

### Global CSS Classes
In `app/globals.css`:
```css
.flo-blue-section {
  background: linear-gradient(135deg, #0047AB 0%, #0066CC 100%);
  color: white;
}

.flo-card {
  @apply bg-white rounded-lg shadow-md p-6 transition-shadow duration-300;
}
```

### Key Components

#### Layout Components
- `<Header />` - Navigation header
- `<Footer />` - Site footer
- `<Section />` - Page section wrapper
- `<Container />` - Content container with max-width
- `<Button />` - Styled button component

#### Feature Components
- `<HubSpotForm />` - HubSpot form integration
- `<InternshipCarousel />` - Auto-rotating image carousel
- `<ProjectsShowcase />` - Homepage projects section

---

## 🔄 Data Flow

### Content Updates
1. Content editor updates content in Strapi CMS
2. Strapi saves to PostgreSQL database
3. Next.js requests data from Strapi API
4. Pages revalidate every 60 seconds (`revalidate: 60`)
5. New content appears on website within 1 minute

### Revalidation Strategy
```typescript
// In page.tsx files
export const revalidate = 60 // Revalidate every 60 seconds
```

### Static Generation
- Internship pages: Pre-generated at build time
- Blog pages: Pre-generated at build time
- Homepage: Revalidated every 60 seconds
- Project pages: Revalidated every 60 seconds

---

## 📦 Content Management

### Adding a New Content Type in Strapi

1. **Access Content-Types Builder**
   - Log into Strapi admin
   - Click "Content-Types Builder"
   - Click "Create new collection type"

2. **Define the Schema**
   ```json
   {
     "displayName": "Team Member",
     "attributes": {
       "name": { "type": "string", "required": true },
       "role": { "type": "string" },
       "bio": { "type": "text" },
       "image": { "type": "media", "allowedTypes": ["images"] },
       "order": { "type": "integer" }
     }
   }
   ```

3. **Create API Function in Frontend**
   ```typescript
   // In lib/strapi.ts
   export async function getTeamMembers(): Promise<TeamMember[]> {
     const response = await fetchAPI<StrapiResponse<TeamMember[]>>(
       '/team-members?populate=*&sort=order:asc'
     )
     return response.data || []
   }
   ```

4. **Use in Pages**
   ```typescript
   const teamMembers = await getTeamMembers()
   ```

---

## 🛠️ Deployment

### Frontend (Vercel)

#### Manual Deployment
```bash
cd frontend
vercel deploy --prod
```

#### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- Vercel pulls from GitHub and builds automatically

#### Environment Variables in Vercel
Set these in Vercel dashboard → Project Settings → Environment Variables:
```
NEXT_PUBLIC_STRAPI_URL=https://strapi-production-7ecb.up.railway.app
STRAPI_API_TOKEN=your_api_token_here
```

### Backend (Railway)

#### Strapi is Auto-Deployed
- Railway watches the `strapi/` directory
- Any push to `main` triggers automatic rebuild
- PostgreSQL database is persistent

#### Environment Variables in Railway
Already configured:
- `DATABASE_URL`
- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `JWT_SECRET`
- `TRANSFER_TOKEN_SALT`

---

## 📜 Scripts

### Import Scripts (in `/scripts`)

#### Import Internships from WordPress
```bash
cd scripts
npm install
export STRAPI_API_TOKEN="your_token"
node import-wordpress-to-strapi.js path/to/wordpress.xml
```

#### Import Blog Posts
```bash
export STRAPI_API_TOKEN="your_token"
node import-blog-posts.js
```

#### Create Projects
```bash
export STRAPI_API_TOKEN="your_token"
node create-projects.js
```

#### Upload Images
```bash
export STRAPI_API_TOKEN="your_token"
node upload-images-to-strapi.js
```

---

## 🔐 Authentication & Security

### Strapi API Token
- Required for all API requests from frontend
- Generated in Strapi: Settings → API Tokens → Create new API Token
- Set permissions to "Full access" for development
- For production, limit to specific content types

### Security Best Practices
1. **Never commit `.env` files** - Use `.env.example` templates
2. **Rotate API tokens regularly**
3. **Use environment-specific tokens** (dev vs prod)
4. **Enable CORS in Strapi** for your frontend domain
5. **Use HTTPS** for all API requests

---

## 🐛 Troubleshooting

### Frontend Issues

#### Build Fails
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Images Not Loading
- Check `NEXT_PUBLIC_STRAPI_URL` is set correctly
- Verify images exist in Strapi media library
- Check Strapi CORS settings allow your domain

#### Data Not Updating
- Wait 60 seconds for revalidation
- Check Strapi API is accessible
- Verify API token is valid
- Check browser console for errors

### Strapi Issues

#### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure database exists

#### API Returns Empty Data
- Check content is **Published** (not Draft)
- Verify API token has correct permissions
- Check Strapi logs: `npm run develop` (shows console output)

#### Can't Access Admin Panel
- Ensure Strapi is running
- Check URL: https://strapi-production-7ecb.up.railway.app/admin
- Clear browser cache
- Try incognito/private window

---

## 📊 Performance Optimization

### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src={getStrapiImageUrl(image.url)}
  alt={image.alternativeText || ''}
  width={800}
  height={600}
  loading="lazy"
/>
```

### Code Splitting
- Components automatically code-split by Next.js
- Use dynamic imports for heavy components:
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
})
```

### Caching Strategy
- Static pages cached by Vercel CDN
- API responses cached for 60 seconds
- Images cached with aggressive cache headers

---

## 🧪 Testing

### Run Development Build
```bash
npm run dev
```

### Run Production Build Locally
```bash
npm run build
npm start
```

### Check for Type Errors
```bash
npm run type-check
```

### Lint Code
```bash
npm run lint
```

---

## 📚 Useful Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Strapi Docs**: https://docs.strapi.io
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app

---

## 🤝 Contributing

### Git Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Description"`
3. Push branch: `git push origin feature/your-feature`
4. Create Pull Request on GitHub
5. After approval, merge to `main`

### Code Style
- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive commit messages

---

## 📞 Support & Contacts

- **Repository**: https://github.com/FlomadLabsRD/hephaestus-international
- **Strapi Admin**: https://strapi-production-7ecb.up.railway.app/admin
- **Production Site**: https://hephaestus-international.vercel.app
- **Issues**: Create GitHub issue for bugs/features

---

## 🎯 Quick Commands Reference

```bash
# Frontend
cd frontend
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm start           # Start production server
vercel deploy --prod # Deploy to Vercel

# Strapi
cd strapi/app
npm install         # Install dependencies
npm run develop     # Start dev server with admin
npm run build       # Build admin panel
npm start           # Start production server

# Scripts
cd scripts
npm install         # Install dependencies
node import-wordpress-to-strapi.js  # Import internships
node import-blog-posts.js           # Import blog posts
node create-projects.js             # Create projects
node upload-images-to-strapi.js     # Upload images
```

---

**Happy coding! 🚀**
