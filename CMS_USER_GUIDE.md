# Strapi CMS — Content Editor Guide

> **Important context:** Strapi is the **optional marketing CMS** for public-facing pages (blog posts, internship listings on the marketing site). It is **not** the HR applicant tracking system.
>
> The HR pipeline (applicant stages, statuses, Chronos sync) is managed through the HR dashboard at `https://efestos.international/me/hr` — not through Strapi.

---

## Logging In

1. Go to the Strapi admin URL (ask your admin for the current URL — it's stored in `/hephaestus-international/CONTENT_STRAPI_URL` in AWS SSM)
2. Enter your email and password
3. Click "Sign in"

---

## What Strapi Manages

| Content Type | Description |
|---|---|
| Internship | Public internship listings shown on the marketing site |
| Blog Post | Blog articles |
| Project | Showcase projects |
| Benefit | Homepage benefits section |
| Vertical | Homepage verticals section |
| Site Setting | Global site config |

These are displayed on the public marketing pages. They are **not** the same as applicant records in the HR pipeline.

---

## Managing Internship Listings

### Add a New Listing

1. Click **Content Manager** → **Internship**
2. Click **Create new entry**
3. Fill out: Title, Slug, Description, Requirements, Responsibilities, Category, Status, Duration, Location
4. Click **Save** then **Publish**

### Edit an Existing Listing

1. **Content Manager** → **Internship**
2. Click the listing title
3. Make changes → **Save** → **Publish**

### Close a Position

Edit the internship and set Status to "Closed" or "Filled". This keeps the record without deleting it.

---

## Managing Blog Posts

1. **Content Manager** → **Blog Post**
2. Click **Create new entry**
3. Fill: Title, Slug, Content (Markdown editor), Summary, Featured Image, Published Date
4. Set Status to "Published" and click **Publish**

Only published entries appear on the website.

---

## Managing Projects

1. **Content Manager** → **Project**
2. Create or edit entries
3. Set **Order** field to control display order (0 = first)

---

## Media Library

1. Click **Media Library** in the main nav
2. Click **Add new assets** or drag-and-drop
3. Add alt text to each image for accessibility

**Image size recommendations:**
- Hero images: 1920×1080px
- Blog featured: 1200×630px
- Project cards: 800×600px
- Keep under 1MB

---

## SEO Fields

Most content types have a Meta section:
- **Meta Title** — 50–60 characters; shows in Google search results
- **Meta Description** — 150–160 characters; shows in Google snippets

Always fill these out for published content.

---

## Troubleshooting

### Changes not showing on the website

1. Did you click both **Save** and **Publish**?
2. Is Status set to "Published" (not "Draft")?
3. Hard-refresh the page: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Can't log in

- Check email/password
- Use the password reset link
- Contact your admin

### I accidentally deleted something

Contact your admin — restoration may be possible from database backup.

---

## HR Pipeline (Not Strapi)

If you need to update an **applicant's stage, status, or Chronos access**, use the HR dashboard:

- URL: `https://efestos.international/me/hr`
- Requires HR role credentials (see `test_assets/test_users.json` for test accounts)

The HR dashboard is part of the Hephaestus Next.js app, not Strapi.
