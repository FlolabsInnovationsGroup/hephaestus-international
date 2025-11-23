# Quick Start: Import WordPress Data to Strapi

Follow these 4 simple steps to import your WordPress internships into Strapi.

## Step 1: Get Your API Token

1. Open Strapi admin: <https://strapi-production-7ecb.up.railway.app/admin>
2. Click **Settings** in the left sidebar
3. Under "Global Settings", click **API Tokens**
4. Click **"Create new API Token"**
5. Fill in:
   - Name: `WordPress Import`
   - Token type: **Full access**
   - Token duration: **Unlimited**
6. Click **Save**
7. **COPY THE TOKEN** (you'll only see it once!)

## Step 2: Set Your Token

Open Terminal and run:

```bash
export STRAPI_API_TOKEN="paste-your-token-here"
```

## Step 3: Run the Import

```bash
cd /Users/elizabethstein/Projects/hephaestus-international/scripts
node import-wordpress-to-strapi.js
```

## Step 4: Check Results

The script will show a summary like:
```
✅ Successfully imported: 35
⏭️  Skipped (duplicates):  0
❌ Failed:                0
```

Then check your live site:
- **Strapi Admin**: <https://strapi-production-7ecb.up.railway.app/admin/content-manager/collection-types/api::internship.internship>
- **Live Website**: <https://hephaestus-international.vercel.app/internships>

---

## Troubleshooting

**Problem**: "STRAPI_API_TOKEN environment variable is required"  
**Solution**: Run `export STRAPI_API_TOKEN="your-token"` first

**Problem**: "XML file not found"  
**Solution**: Pass the file path: `node import-wordpress-to-strapi.js /path/to/file.xml`

**Problem**: "HTTP 401" or "HTTP 403"  
**Solution**: Create a new token with "Full access" permissions

---

That's it! Your WordPress internships should now be live on your website. 🎉
