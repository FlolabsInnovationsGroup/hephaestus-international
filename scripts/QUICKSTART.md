# Scripts Quick Start (Historical)

> **This is a historical document.** These scripts were used for a one-time migration of WordPress internship data into Strapi. The migration is complete — all 39 internships have been synced. You do not need to run these scripts again under normal circumstances.
>
> If you need to re-run a sync (e.g., after a Strapi reset), the scripts are still functional. See `README.md` in this directory for the full list.

---

## If You Need to Re-Run an Import

### Step 1: Get a Strapi API Token

1. Open the Strapi admin (URL from `/hephaestus-international/CONTENT_STRAPI_URL` in AWS SSM)
2. Settings → API Tokens → Create new API Token
3. Name: `Import Script`, Token type: **Full access**, Duration: **Unlimited**
4. Copy the token (shown only once)

### Step 2: Set the Token

```bash
export STRAPI_API_TOKEN="paste-your-token-here"
```

### Step 3: Install Dependencies

```bash
cd scripts
npm install
```

### Step 4: Run the Script

```bash
node sync-missing-internships.js
```

### Step 5: Verify

Check the Strapi admin Content Manager → Internship. You should see all entries listed.

---

## Note on Script State

All migration scripts (`import-wordpress-to-strapi.js`, `import-blog-posts.js`, etc.) are preserved in git history but have been removed from the working directory. Only `sync-missing-internships.js` and supporting content scripts remain.
