# Hephaestus.International - Modern Website

> Modern, high-performance website built with Next.js 16 and Strapi CMS

## 📋 Project Overview

A complete redesign of hephaestus.international, moving from WordPress to a modern JAMstack architecture using Next.js 16, Strapi v5 (headless CMS), and PostgreSQL.

**Live Site:** https://hephaestus-international.vercel.app (or custom domain TBD)
**CMS Admin:** https://strapi-production-7ecb.up.railway.app/admin  
**Original Site:** https://hephaestus.international (WordPress - legacy)

## ✅ Current Status

**Status:** ✅ **Production Ready** - Migration Complete  
**Last Updated:** November 8, 2025

### What's Live
- ✅ 8 project pages with descriptions and external links
- ✅ 39 internship positions with HubSpot application forms
- ✅ 13 blog posts (5 published, 8 drafts)
- ✅ Full responsive design matching WordPress exactly
- ✅ All images and media migrated
- ✅ SEO metadata on all pages
- ✅ 60-second ISR (Incremental Static Regeneration)

## 🛠 Technology Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **Forms:** HubSpot Embedded Forms

### Backend & CMS
- **CMS:** Strapi v5.31.0 (headless CMS)
- **Database:** PostgreSQL 16
- **API:** RESTful API with Bearer token auth

### Hosting & Deployment
- **Frontend:** Vercel (auto-deploy from main branch)
- **Backend:** Railway (Strapi + PostgreSQL)
- **Revalidation:** 60-second ISR for fresh content

## 📁 Project Structure

```text
frontend/          # Next.js application
├── app/          # App Router pages
│   ├── page.tsx              # Homepage
│   ├── about/page.tsx        # About page
│   ├── projects/page.tsx     # Projects listing
│   ├── internships/          # Internships pages
│   │   ├── page.tsx          # List view with search
│   │   └── [slug]/page.tsx   # Individual internship
│   └── blogs/                # Blog pages
│       ├── page.tsx          # Blog listing
│       └── [slug]/page.tsx   # Individual blog post
├── components/   # React components
│   ├── header.tsx           # Navigation & mobile menu
│   ├── footer.tsx           # Footer with links
│   ├── hero.tsx             # Hero sections
│   └── hubspot-form.tsx     # HubSpot form integration
├── lib/          # Utilities
│   ├── strapi.ts            # Strapi API client
│   └── types.ts             # TypeScript interfaces
└── public/       # Static assets

strapi/app/       # Strapi CMS
├── src/api/      # Content types
│   ├── internship/          # 39 internships
│   ├── project/             # 8 projects  
│   └── blog-post/           # 13 blog posts
├── config/       # Strapi configuration
└── database/     # PostgreSQL migrations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Access to environment variables (contact admin)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hephaestus-international
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables**
   Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_STRAPI_URL=https://strapi-production-7ecb.up.railway.app
   STRAPI_API_TOKEN=<your-full-access-token>
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Visit http://localhost:3000

### Strapi CMS Local Setup (Optional)

Only needed if modifying Strapi schema:

```bash
cd strapi/app
npm install
# Set DATABASE_URL in .env
npm run develop
```

Visit http://localhost:1337/admin

## 📝 Content Management

### For Content Editors
See **[CMS_USER_GUIDE.md](./CMS_USER_GUIDE.md)** for detailed instructions on:
- Adding/editing internships
- Managing blog posts
- Updating projects
- Uploading images

### For Developers  
See **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** for:
- Technical setup
- API integration
- Component patterns
- Deployment procedures

## 🎨 Design System

### Colors
- **Flo Blue:** `#00349B` (primary)
- **Dark Blue:** `#002775` (hover states)
- **Light Blue:** `#5ba3ff` (hero text)

### Typography
- **Headings:** Poppins (600-700 weight)
- **Body:** Roboto (300-500 weight)

### Components
- Cards with hover effects
- Responsive grid layouts
- HubSpot form integration
- Mobile-first navigation

## 📊 Content Statistics

| Type | Count | Status |
|------|-------|--------|
| Internships | 39 | ✅ All migrated |
| Projects | 8 | ✅ All migrated |
| Blog Posts | 13 | ✅ 5 published, 8 drafts |
| Images | 18+ | ✅ All uploaded |
| Pages | 8 main | ✅ All functional |

## 🔧 Development Commands

```bash
# Frontend (from /frontend)
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Strapi (from /strapi/app)  
npm run develop      # Development with admin UI
npm run start        # Production mode
npm run build        # Build admin panel
```

## 🚢 Deployment

### Frontend (Vercel)
- **Auto-deploys** from `main` branch
- Environment variables configured in Vercel dashboard
- Custom domain: TBD (ready for DNS switch)

### Backend (Railway)
- **Auto-deploys** from `main` branch
- PostgreSQL database included
- Environment variables set in Railway dashboard

## � Documentation

- **[README.md](./README.md)** - This file (project overview)
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Technical setup & patterns
- **[CMS_USER_GUIDE.md](./CMS_USER_GUIDE.md)** - Content editor instructions  
- **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** - High-level project summary
- **[MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)** - Historical migration context
- **[STRAPI_CMS_STRATEGY.md](./STRAPI_CMS_STRATEGY.md)** - Future CMS enhancements
- **[UX_ENHANCEMENTS_GUIDE.md](./UX_ENHANCEMENTS_GUIDE.md)** - Modern UI/UX improvements
- **[QA_CHECKLIST.md](./QA_CHECKLIST.md)** - Testing & validation checklist

## 🔐 Environment Variables

### Frontend (Next.js)
```env
NEXT_PUBLIC_STRAPI_URL=https://strapi-production-7ecb.up.railway.app
STRAPI_API_TOKEN=<full-access-token>
```

### Backend (Strapi)
```env
DATABASE_URL=<railway-postgres-connection-string>
APP_KEYS=<secret-keys>
API_TOKEN_SALT=<secret>
ADMIN_JWT_SECRET=<secret>
JWT_SECRET=<secret>
```

## 🎯 Key Features

### Performance
- ⚡ Static generation with 60s ISR
- 🖼️ Optimized image loading
- 📱 Mobile-first responsive design
- ⚡ Fast page loads (<2s)

### Content Management
- 📝 Easy Strapi admin interface
- 🔄 Changes reflect in 60 seconds
- 📊 No code changes needed for content
- 🖼️ Built-in media library

### HubSpot Integration
- 📋 Embedded application forms
- 🎯 Portal ID: 45023159
- 🔗 Form ID: 0133caf3-53e5-403f-a894-cd0246642913
- ✅ Working on all 39 internship pages

### Developer Experience
- 💻 TypeScript for type safety
- 🎨 Tailwind CSS for styling
- ⚛️ Modern React patterns
- 🔧 Hot module replacement
- 📦 Modular component architecture

## 🐛 Troubleshooting

### Data not updating?
- Wait 60 seconds (revalidation period)
- Check content is Published in Strapi (not Draft)
- Verify STRAPI_API_TOKEN has correct permissions

### Images not loading?
- Check image URLs are absolute in Strapi
- Verify NEXT_PUBLIC_STRAPI_URL is correct
- Check Network tab for 404s

### Build failures?
- Ensure all env vars set in Vercel
- Verify Strapi is accessible at build time
- Clear Next.js cache: `rm -rf .next && npm run build`

## 📞 Support

### For Content Updates
- Use Strapi admin panel
- See [CMS_USER_GUIDE.md](./CMS_USER_GUIDE.md)
- Contact: [Content Manager Email]

### For Technical Issues
- Check [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- Create GitHub issue
- Contact: [Dev Team Email]

### Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Strapi Docs](https://docs.strapi.io)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 📄 License

[Your License Here]

---

**Ready for Production** ✅  
Last Updated: November 8, 2025  
Maintained by: Flo Labs Development Team


## About Hephaestus.International

Hephaestus.International is powered by Flo Labs International infrastructure and technology. 

This site maintains the same architecture and capabilities as Flo Labs International but operates as an independent brand focused on [specific focus area to be defined].


