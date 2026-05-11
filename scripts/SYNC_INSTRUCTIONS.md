# Sync Instructions (Historical)

> **Status: Completed.** This document describes a one-time internship sync from WordPress data to Strapi. All 39 internships are now in Strapi. Keep this document for reference if a re-sync is ever needed (e.g., after a Strapi reset).

---

## Background

- WordPress had **39 internships**
- Initial Strapi migration had only ~25 internships
- `sync-missing-internships.js` was used to upload the missing entries from a static data file

**Current state:** All 39 internships are in Strapi.

---

## Running a Re-Sync (If Needed)

### Prerequisites

1. Strapi API token with full access (Settings → API Tokens in Strapi admin)
2. Set it:
   ```bash
   export STRAPI_API_TOKEN="your-token-here"
   ```

### Run the Script

```bash
cd scripts
npm install
node sync-missing-internships.js
```

### Expected Output

```
Starting internship sync...
Found N internships in static file
Found M internships in Strapi
Missing internships: X
Uploading...
Sync complete: X uploaded, 0 failed
```

### Verify

Check Strapi admin → Content Manager → Internship. Should show 39 entries.

---

## Internship List (Reference)

All 39 internship titles that should exist in Strapi:

1. GTM Influencer Intern
2. GTM Engineer Intern
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
21–39. (Additional entries from the original WordPress site)

---

## Troubleshooting

**`STRAPI_API_TOKEN` environment variable is required**
→ Run `export STRAPI_API_TOKEN="your-token"` first

**401 Unauthorized**
→ Token expired or lacks permissions. Generate a new Full access token.

**403 Forbidden**
→ Token doesn't have permission to create internships. Regenerate with Full access.
