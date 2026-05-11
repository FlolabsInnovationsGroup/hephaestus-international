# Scripts — Strapi Data Management

> **Status: Migration complete.** These scripts were used to populate Strapi with marketing content migrated from a WordPress site. All 39 internships and other content have been synced. The scripts are kept for reference and potential re-sync.

This directory contains Node.js scripts for managing content in the Strapi CMS instance.

**Note:** These scripts interact with Strapi (the optional marketing CMS), not the HR applicant tracking database. For the HR pipeline, use the dashboard at `https://efestos.international/me/hr`.

---

## Prerequisites

1. Install dependencies:
   ```bash
   cd scripts
   npm install
   ```

2. Set your Strapi API token:
   ```bash
   export STRAPI_API_TOKEN="your-token-here"
   ```
   Get a token from Strapi admin → Settings → API Tokens (Full access).

---

## Available Scripts

### Sync Missing Internships

```bash
node sync-missing-internships.js
```

All 39 internships are currently synced. Run this only if internships are missing after a Strapi reset.

### Create Projects

```bash
node create-projects.js
```

### Import Blog Posts

```bash
node import-blog-posts.js
```

### Upload Images to Strapi

```bash
node upload-images-to-strapi.js
```

### Populate Homepage Sections

```bash
node populate-homepage-sections.js
```

### Populate About Page

```bash
node populate-about-page.js
```

### Set Strapi Permissions

```bash
node set-strapi-permissions.js
```

---

## Removed Scripts

The following were used during the initial WordPress migration and have been removed from the working directory (preserved in git history):

- `import-wordpress-to-strapi.js`
- `check-internships.js`, `compare-internships.js`, `check-projects.js`
- `clear-projects-db.js`, `delete-null-projects.js`
- `fix-homepage-flags.js`, `publish-all-projects.js`
- `set-homepage-projects.js`, `update-*.js`
