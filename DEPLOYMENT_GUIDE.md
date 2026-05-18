# Hephaestus.International Deployment Guide

> **ARCHIVED / HISTORICAL** — this document describes the original Vercel (frontend) + Railway (Strapi) deployment that is no longer active. The current production deployment uses AWS CodeBuild → ECR → App Runner (primary) or GitHub Actions → ECR → App Runner (fallback). The database is **Neon serverless PostgreSQL** shared with Chronos, not Railway PostgreSQL. **For current deployment instructions, read `DEPLOYMENT.md`.**

---

This guide covers deploying Hephaestus.International on AWS using the same credentials and shared database account model as Chronos.

## Architecture Overview

- **Frontend**: Next.js 16 on AWS App Runner
- **Backend**: Strapi v5 (existing content backend)
- **Database/Auth identity**: shared PostgreSQL account model with Chronos (`users`, `user_email_aliases`, `applicants`)
- **Domain**: hephaestus.international

## Canonical deployment path

Use GitHub Actions -> AWS OIDC -> ECR -> App Runner:

- Workflow: `.github/workflows/deploy-aws-apprunner.yml`
- Bootstrap IAM/secrets: `deploy/aws/setup-github-actions-deploy.ps1`
- Bootstrap docs: `deploy/aws/README-github-actions.md`

The workflow reads the shared DB credential from `/flolabs-chronos/DATABASE_URL` and Hephaestus-specific runtime values from `/hephaestus-international/*` in AWS SSM.

## Environment Variables

### Frontend (Vercel)

Create these environment variables in your Vercel project:

```env
# Strapi API Configuration
NEXT_PUBLIC_STRAPI_URL=https://hephaestus-strapi-production.up.railway.app
STRAPI_API_TOKEN=<your-strapi-api-token>

# Optional: Analytics, monitoring, etc.
NEXT_PUBLIC_GA_ID=<google-analytics-id>
```

### Backend (Railway - Strapi)

Create these environment variables in your Railway project:

```env
# Database (Railway auto-provides DATABASE_URL)
DATABASE_URL=<railway-postgres-connection-string>

# Strapi Security Keys (generate new ones!)
APP_KEYS=<key1>,<key2>,<key3>,<key4>
API_TOKEN_SALT=<random-string>
ADMIN_JWT_SECRET=<random-string>
JWT_SECRET=<random-string>
TRANSFER_TOKEN_SALT=<random-string>

# Strapi Configuration
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

# CORS Origins (update after Vercel deployment)
CLIENT_URL=https://hephaestus.international
```

### How to Generate Secrets

Use this command to generate random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run it 4 times for APP_KEYS (comma-separated), and once each for the other secrets.

## Deployment Steps

### Step 1: Deploy Strapi Backend

1. **Create Railway Project**
   - Go to railway.app
   - Create new project
   - Add PostgreSQL database
   - Add new service from GitHub repo

2. **Configure Railway**
   - Point to `hephaestus-international/strapi/app` directory
   - Set all environment variables listed above
   - Set build command: `npm run build`
   - Set start command: `npm run start`

3. **Generate Railway Domain**
   - Railway will provide a URL like: `hephaestus-strapi-production.up.railway.app`
   - Copy this URL for the frontend configuration

4. **Create Strapi Admin**
   - Visit the Railway-provided URL + `/admin`
   - Create your admin account
   - Generate an API token with full access (Settings → API Tokens)

### Step 2: Deploy Next.js Frontend

1. **Create Vercel Project**
   - Go to vercel.com
   - Import from GitHub
   - Select `hephaestus-international` repository
   - Set root directory to `frontend`

2. **Configure Vercel**
   - Set environment variables (see above)
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Output directory: `.next`

3. **Deploy**
   - Click "Deploy"
   - Vercel will provide a URL like: `hephaestus-international.vercel.app`

### Step 3: Configure Custom Domain

1. **Add Domain to Vercel**
   - In Vercel project settings → Domains
   - Add `hephaestus.international`
   - Follow DNS configuration instructions

2. **Update Strapi CORS**
   - In Railway, update `CLIENT_URL` env variable to production domain
   - Add domain to Strapi `middlewares.ts` if not already there

3. **Update Next.js Config**
   - Verify `next.config.ts` has correct Strapi image domains
   - Redeploy if needed

### Step 4: Migrate Content from Flo Labs Strapi

You have two options:

#### Option A: Fresh Start (Recommended)
- Use the existing migration scripts in `/scripts`
- Populate content through Strapi admin panel
- Customize for Hephaestus branding

#### Option B: Clone Flo Labs Content
1. Export content from Flo Labs Strapi using the Transfer feature
2. Import into Hephaestus Strapi
3. Update content to reflect Hephaestus branding

### Step 5: Verify Deployment

Run through this checklist:

- [ ] Homepage loads correctly
- [ ] Navigation works (all menu items)
- [ ] Internships page displays
- [ ] Individual internship pages load
- [ ] Projects showcase works
- [ ] Blog posts display
- [ ] Contact form submits (if applicable)
- [ ] HubSpot forms load
- [ ] Images load from Strapi
- [ ] Footer shows "Powered by Flo Labs"
- [ ] SEO metadata is correct

## Post-Deployment Tasks

1. **Set up Monitoring**
   - Add Vercel Analytics
   - Configure Strapi monitoring
   - Set up error tracking (Sentry, etc.)

2. **Configure DNS**
   - Point hephaestus.international to Vercel
   - Set up SSL (Vercel handles this automatically)

3. **Update Strapi Permissions**
   - Review API permissions in Strapi
   - Ensure public endpoints are configured correctly

4. **Test Performance**
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Verify ISR (60s revalidation) is working

## Maintenance

### Updating Content
- Log into Strapi admin: `<railway-url>/admin`
- Content changes appear within 60 seconds (ISR)

### Updating Code
- Push to GitHub
- Vercel auto-deploys from `main` branch
- Railway auto-deploys from `main` branch

## Troubleshooting

### Frontend Not Loading
- Check `NEXT_PUBLIC_STRAPI_URL` is correct
- Verify Strapi is accessible
- Check browser console for errors

### Strapi Connection Errors
- Verify DATABASE_URL is correct
- Check Railway logs
- Ensure all secrets are set

### Images Not Loading
- Verify Strapi media library has images
- Check `next.config.ts` image domains
- Ensure CORS is configured correctly

### Content Not Updating
- Wait 60 seconds (ISR revalidation period)
- Check content is Published (not Draft) in Strapi
- Clear Vercel cache if needed

## Support

For issues specific to Hephaestus.International deployment, contact the Flo Labs development team.

For general Next.js or Strapi issues, refer to their official documentation:
- [Next.js Docs](https://nextjs.org/docs)
- [Strapi Docs](https://docs.strapi.io)
