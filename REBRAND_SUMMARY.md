# Hephaestus.International Rebranding Summary

This document summarizes the changes made to rebrand Flo Labs International to Hephaestus.International.

## Project Location
- **New Directory**: `/Users/elizabethstein/Projects/FloLabs/hephaestus-international/`
- **Original**: `/Users/elizabethstein/Projects/FloLabs/flolabsinternational/`

## Brand Changes Applied

### Primary Replacements
1. **"Flolabs International"** → **"Hephaestus.International"**
2. **"Flo Labs International"** → **"Hephaestus.International"**
3. **"flolabs.international"** → **"hephaestus.international"**
4. **"flolabsinternational"** → **"hephaestus-international"**
5. **"FLO LABS R&D"** → **"HEPHAESTUS R&D"**
6. **"FLO LABS"** → **"HEPHAESTUS"**

### Content Replacements
- **"Flo Labs family"** → **"Hephaestus family"**
- **"<strong>Flo Labs"** → **"<strong>Hephaestus"**
- Component fallback text updated
- Hero title updated
- Footer section header updated

### Preserved References (Intentional)
✅ **"A Flo Labs Company"** - Footer attribution preserved
✅ **"Flo Labs R&D"** - Footer link preserved
✅ **"Powered by Flo Labs"** - Attribution preserved (if used)

## Technical Changes

### Frontend (`/frontend`)
- ✅ Metadata titles and descriptions
- ✅ Component default content
- ✅ All page titles
- ✅ SEO metadata
- ✅ Image alt texts
- ✅ README documentation

### Backend (`/strapi`)
- ✅ Docker container names: `flolabs-*` → `hephaestus-*`
- ✅ Database name: `flolabs` → `hephaestus`
- ✅ CORS origins updated to `hephaestus.international`
- ✅ Strapi README updated
- ✅ Schema descriptions updated

### Scripts (`/scripts`)
- ✅ Package name updated
- ✅ Script comments and references updated
- ✅ Content population scripts updated

### Documentation
- ✅ Main README
- ✅ Developer Guide
- ✅ CMS User Guide
- ✅ QA Checklist
- ✅ Copilot Instructions
- ✅ All markdown files

## Files Requiring Manual Updates

### Environment Variables
You'll need to manually configure these in your deployment platforms:

#### Vercel (Frontend)
```env
NEXT_PUBLIC_STRAPI_URL=https://hephaestus-strapi-production.up.railway.app
STRAPI_API_TOKEN=<new-token-from-hephaestus-strapi>
```

#### Railway (Strapi)
```env
DATABASE_URL=<new-postgres-connection>
APP_KEYS=<generate-new>
API_TOKEN_SALT=<generate-new>
ADMIN_JWT_SECRET=<generate-new>
JWT_SECRET=<generate-new>
TRANSFER_TOKEN_SALT=<generate-new>
CLIENT_URL=https://hephaestus.international
```

### HubSpot Forms
- HubSpot portal ID remains `45023159` (shared with Flo Labs)
- Individual form IDs in Strapi will need to be updated if you create new Hephaestus-specific forms

### Custom Domain
- Configure DNS for `hephaestus.international` to point to Vercel
- Update domain in Vercel project settings
- Ensure SSL certificate is configured (automatic with Vercel)

## Content Migration Strategy

### Recommended Approach
1. **Deploy fresh Strapi instance** for Hephaestus
2. **Use migration scripts** in `/scripts` to populate initial content
3. **Manually customize** content for Hephaestus branding
4. **Update images** as needed for Hephaestus brand

### Alternative: Content Export/Import
1. Export content from Flo Labs Strapi (Transfer feature)
2. Import to Hephaestus Strapi
3. Update content references to Hephaestus
4. Replace images if needed

## Verification Checklist

After deployment, verify:

- [ ] Site loads at `hephaestus.international`
- [ ] All page titles show "Hephaestus.International"
- [ ] Hero section shows "HEPHAESTUS R&D"
- [ ] Footer shows "HEPHAESTUS" header
- [ ] Footer still shows "A Flo Labs Company" attribution
- [ ] All metadata is correct
- [ ] Images load from new Strapi instance
- [ ] Internships display correctly
- [ ] Projects showcase works
- [ ] Blog posts load
- [ ] HubSpot forms embed correctly
- [ ] Navigation works properly

## Next Steps

1. **Create GitHub Repository**
   - Create new repo: `hephaestus-international`
   - Push code to GitHub
   - Configure branch protection

2. **Deploy to Railway**
   - Create Railway project
   - Add PostgreSQL database
   - Deploy Strapi from GitHub
   - Generate API token

3. **Deploy to Vercel**
   - Import project from GitHub
   - Configure environment variables
   - Deploy frontend

4. **Configure Domain**
   - Add `hephaestus.international` to Vercel
   - Update DNS records
   - Verify SSL

5. **Populate Content**
   - Use migration scripts or manual entry
   - Upload images to Strapi media library
   - Publish all content

6. **Test Thoroughly**
   - Run through QA checklist
   - Test all user flows
   - Verify SEO metadata

## Maintenance Notes

- This is a **complete copy** of Flo Labs International
- Updates to Flo Labs will NOT automatically apply to Hephaestus
- Maintain both codebases independently going forward
- Both sites can share the HubSpot portal if desired
- Consider creating Hephaestus-specific analytics/tracking

## Support

For deployment questions, refer to `DEPLOYMENT_GUIDE.md`.

For technical questions about the rebrand, contact the Flo Labs development team.
