# Sync Missing Internships to Strapi

## Problem (Historical - Now Resolved)
- WordPress had **39 internships**
- Initial Strapi migration had only **~25 internships**  
- **~14 internships were missing** from Strapi
- This script was used to sync the missing internships

**Current Status**: All 39 internships are now in Strapi. This script is kept for reference/re-sync if needed.

## Solution
Run the sync script to upload the missing internships from the static data file to Strapi.

## Prerequisites

### 1. Get Your Strapi API Token

1. Go to Strapi admin: https://strapi-production-7ecb.up.railway.app/admin
2. Log in with your credentials
3. Go to **Settings** → **API Tokens** → **Create new API Token**
4. Configure the token:
   - Name: `Internship Sync Script`
   - Token type: `Full access` (or `Custom` with `Internship: create` permission)
   - Token duration: `Unlimited` or `90 days`
5. Click **Save** and copy the generated token

### 2. Set the Token

**Option A: Set environment variable (recommended for one-time use)**
```bash
export STRAPI_API_TOKEN="your-token-here"
```

**Option B: Add to .env.local (recommended for multiple runs)**
```bash
cd /Users/elizabethstein/Projects/hephaestus-international/frontend
echo 'STRAPI_API_TOKEN=your-token-here' >> .env.local
```

## Run the Sync Script

```bash
cd /Users/elizabethstein/Projects/hephaestus-international/scripts
node sync-missing-internships.js
```

## Expected Output

```
🔍 Starting internship sync...

📂 Loading static internships from file...
   Found 39 internships in static file

🌐 Fetching existing internships from Strapi...
   Found 25 internships in Strapi

🔎 Identifying missing internships...
   Missing internships: 14

📤 Uploading missing internships to Strapi...

   Uploading: GTM Influencer Intern
   ✅ Success

   Uploading: Finance Intern
   ✅ Success

   ...

==================================================
📊 Sync Summary:
==================================================
✅ Successfully uploaded: 14
❌ Failed: 0
📝 Total missing: 14
==================================================

🎉 Internships have been synced to Strapi!
```

## Missing Internships to be Added

1. GTM Influencer Intern
2. GTM Engineer (Go-To-Market Engineer) Intern
3. Space Science Intern
4. Quantum Engineer Intern
5. Animal Science and Veterinary Research Intern
6. Research Associate Intern (Open-Source Projects)
7. Finance Intern
8. Social Media Intern
9. Journalism & PR Intern
10. SEO Specialist Intern
11. Hospitality and Tourism Intern
12. Sport Science Intern
13. UI/UX Design Intern
14. Robotics Engineering Intern
15. Quality Assurance Intern
16. Operations Intern
17. Prompt Engineer Intern
18. Product Development Intern (AI & Robotics)
19. Ethical and Legal Research Intern
20. Business Development and Sales Intern (AI & Robotics)

## Verify the Sync

After running the script, verify the internships are in Strapi:

1. Go to: <https://strapi-production-7ecb.up.railway.app/admin/content-manager/collection-types/api::internship.internship>
2. You should now see **39 internships**

Or check via API:
```bash
curl -s https://strapi-production-7ecb.up.railway.app/api/internships | jq '.data | length'
```

## Rebuild and Deploy

After syncing, rebuild your Next.js site to fetch the updated internships:

```bash
cd /Users/elizabethstein/Projects/hephaestus-international/frontend
npm run build
```

The build should now show **39 internship pages** instead of 25.

## Troubleshooting

**Error: STRAPI_API_TOKEN environment variable is required**
- Make sure you exported the token or added it to .env.local

**Error: 401 Unauthorized**
- Your token may have expired or doesn't have correct permissions
- Generate a new token with `Full access` or `Internship: create` permission

**Error: 403 Forbidden**
- Your token doesn't have permission to create internships
- Regenerate the token with proper permissions

**Internships not showing up on site**
- Strapi caching: Wait 60 seconds (revalidate time)
- Or rebuild the Next.js site: `npm run build`
