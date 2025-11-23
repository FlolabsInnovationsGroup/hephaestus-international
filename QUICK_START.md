# Hephaestus.International - Quick Start Guide

Get Hephaestus.International up and running quickly.

## What is This?

This is a complete rebrand of Flo Labs International to Hephaestus.International. It maintains all the same functionality but with Hephaestus branding throughout (while keeping "Powered by Flo Labs" attribution in the footer).

## Prerequisites

- Node.js 18-20 (use `nvm use 20`)
- Git
- Accounts: Vercel, Railway, GitHub

## 5-Minute Local Development Setup

```bash
# 1. Navigate to the project
cd /Users/elizabethstein/Projects/FloLabs/hephaestus-international

# 2. Start frontend (in one terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000

# 3. Start Strapi (in another terminal)
cd strapi/app
npm install
npm run develop
# Runs on http://localhost:1337
```

**Note:** You'll need to create the Strapi admin account on first run at http://localhost:1337/admin

## Production Deployment

### Step 1: Push to GitHub (5 minutes)

```bash
cd /Users/elizabethstein/Projects/FloLabs/hephaestus-international
git init
git add .
git commit -m "Initial commit: Hephaestus.International rebrand"
git branch -M main
git remote add origin https://github.com/YOUR-ORG/hephaestus-international.git
git push -u origin main
```

### Step 2: Deploy Strapi to Railway (10 minutes)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Select `hephaestus-international`
4. Add PostgreSQL database service
5. Configure Strapi service:
   - Root directory: `strapi/app`
   - Build command: `npm run build`
   - Start command: `npm run start`
6. Add environment variables (see DEPLOYMENT_GUIDE.md)
7. Generate domain (e.g., `hephaestus-strapi-production.up.railway.app`)
8. Create admin account at `[railway-url]/admin`
9. Generate API token: Settings → API Tokens → Create new token

### Step 3: Deploy Frontend to Vercel (5 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Import from GitHub → Select `hephaestus-international`
3. Configure:
   - Root directory: `frontend`
   - Framework: Next.js
4. Add environment variables:
   ```
   NEXT_PUBLIC_STRAPI_URL=https://[your-railway-url]
   STRAPI_API_TOKEN=[token-from-strapi]
   ```
5. Deploy!

### Step 4: Add Custom Domain (5 minutes)

1. In Vercel: Settings → Domains → Add `hephaestus.international`
2. Configure DNS as instructed by Vercel
3. Wait for SSL (automatic, ~5 mins)
4. Update `CLIENT_URL` in Railway to `https://hephaestus.international`

## What Changed from Flo Labs?

✅ **All branding changed to Hephaestus**
- Site titles, metadata, hero sections
- All references throughout the code
- Docker container names
- Database names

✅ **Footer attribution preserved**
- Still shows "A Flo Labs Company"
- Link to Flo Labs R&D maintained

✅ **Complete independence**
- Separate Strapi instance
- Separate database
- Separate deployment
- No impact on Flo Labs site

## Key Files

- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `REBRAND_SUMMARY.md` - Complete list of changes
- `README.md` - Project overview
- `frontend/` - Next.js application
- `strapi/app/` - Strapi CMS
- `scripts/` - Data migration utilities

## Troubleshooting

### "Cannot find module" errors
```bash
cd frontend && npm install
cd ../strapi/app && npm install
```

### Node version issues
```bash
nvm install 20
nvm use 20
nvm alias default 20
```

### Strapi connection errors
- Check `NEXT_PUBLIC_STRAPI_URL` is correct
- Verify Strapi is running
- Ensure CORS is configured in `strapi/app/config/middlewares.ts`

### Build failures
```bash
# Clear caches
rm -rf frontend/.next
rm -rf frontend/node_modules
cd frontend && npm install && npm run build
```

## Next Steps After Deployment

1. **Populate content** - Use Strapi admin to add internships, projects, blog posts
2. **Upload images** - Add to Strapi media library
3. **Test everything** - Go through the QA checklist
4. **Set up monitoring** - Vercel Analytics, error tracking
5. **Configure backups** - Railway database backups

## Getting Help

- **Deployment issues**: See `DEPLOYMENT_GUIDE.md`
- **Technical questions**: Contact Flo Labs dev team
- **Content management**: See `CMS_USER_GUIDE.md`
- **Next.js docs**: https://nextjs.org/docs
- **Strapi docs**: https://docs.strapi.io

## Important Notes

⚠️ **This is a separate site** - Changes to Flo Labs won't affect Hephaestus
⚠️ **Generate new secrets** - Don't reuse Flo Labs secrets (APP_KEYS, JWT_SECRET, etc.)
⚠️ **Separate Strapi** - Deploy a new Strapi instance, don't share with Flo Labs
✅ **HubSpot can be shared** - Same portal ID (45023159) works for both sites

---

**You're all set!** 🎉

The Hephaestus.International site is ready to deploy. Follow the steps above and refer to the detailed guides as needed.
