# Strapi App — Optional Marketing CMS

> **Context:** This Strapi instance powers public marketing pages for `efestos.international` (internship listings, blog posts, projects). It is **not** the HR applicant tracking system. The Next.js app works without Strapi — if `CONTENT_STRAPI_URL` is unset, a build warning is logged and everything else runs normally.
>
> For the HR pipeline, see `ARCHITECTURE.md`.

---

## Quick Start

### Prerequisites

- Node.js 18–20

### Install

```bash
npm install
```

### Environment Variables

Create `.env`:

```env
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://user:password@host:port/database
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=random-string
ADMIN_JWT_SECRET=random-string
TRANSFER_TOKEN_SALT=random-string
JWT_SECRET=random-string
```

Generate secure secrets:

```bash
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

### Development

```bash
npm run develop
```

Admin panel: http://localhost:1337/admin

### Production

```bash
npm run build
npm start
```

---

## Content Types

### Collection Types
- **Internship** — public internship listings
- **Project** — showcase projects
- **Blog Post** — blog articles
- **Benefit / Vertical / Methodology Item** — homepage sections
- **Intern** — team member profiles

### Single Types
- **Site Setting** — global site configuration

---

## API Endpoints

```
GET /api/internships?populate=*
GET /api/projects?populate=*&sort=order:asc
GET /api/blog-posts?populate=*&sort=publishedDate:desc
GET /api/benefits?populate=*&sort=order:asc
GET /api/site-setting?populate=*
```

Authentication: `Authorization: Bearer <api-token>` (create tokens in Settings → API Tokens).

---

## Developer Notes

### Adding a New Content Type

1. Use Content-Type Builder in admin panel
2. Set permissions in Settings → Roles → Public
3. Add API function in `frontend/lib/strapi.ts`
4. Add TypeScript interface in `frontend/lib/types.ts`

### Media

Images are stored in `/public/uploads/` locally. In production, configure an upload provider (S3, Cloudinary, etc.) via Strapi plugins.

---

## Scripts

```bash
npm run develop  # Dev mode with hot reload and admin UI
npm run start    # Production mode
npm run build    # Build admin panel
npm run strapi   # Strapi CLI
```

---

## Troubleshooting

### Can't access admin panel
- Verify Strapi is running: `http://localhost:1337/admin`
- Clear browser cache or try incognito

### Database connection errors
- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is running

### Reset admin password

```bash
node reset-admin.js
```

---

## Documentation

- `CMS_USER_GUIDE.md` — content editor guide
- `DEVELOPER_GUIDE.md` — full Hephaestus developer guide
- Strapi docs: https://docs.strapi.io
