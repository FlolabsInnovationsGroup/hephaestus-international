# Strapi CMS — Optional Marketing CMS

> **Context:** Strapi is the **optional marketing CMS** for Hephaestus. It powers public-facing pages (internship listings, blog posts, projects). The core HR applicant tracking platform (`https://efestos.international`) works without it — if `CONTENT_STRAPI_URL` is not set, a build warning is logged and the app runs normally.
>
> For the HR pipeline (applicant stages, Chronos sync, lead management), see `ARCHITECTURE.md` and `DEVELOPER_GUIDE.md`.

---

## Quick Start

### 1. Generate Secrets

```bash
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
```

Copy these to a `.env` file in the `strapi/` directory.

### 2. Start Services

```bash
cd strapi
docker-compose up -d
```

This starts PostgreSQL (port 5433) and Strapi (http://localhost:1337).

### 3. Create Admin User

Visit http://localhost:1337/admin on first run.

---

## Content Types

- **Internship** — public internship listings for the marketing site
- **Project** — FloLabs showcase projects
- **Blog Post** — articles
- **Benefit / Vertical / Methodology Item** — homepage sections
- **Site Setting** — global config

These are separate from `flolabs_users` (the HR pipeline table in the shared Neon database).

---

## Managing Content

For content editors: see `CMS_USER_GUIDE.md`.

For developers: see `strapi/app/README.md`.

---

## API Endpoints

### Public (no auth required)

```
GET /api/internships?populate=*
GET /api/projects?populate=*&sort=order:asc
GET /api/blog-posts?populate=*&sort=publishedDate:desc
```

### Authenticated Write Operations

Use Bearer token from Settings → API Tokens in the Strapi admin.

---

## Production

The Strapi URL is stored in AWS SSM at `/hephaestus-international/CONTENT_STRAPI_URL` and injected into the Next.js build as `NEXT_PUBLIC_STRAPI_URL`. It is fetched at deploy time by the GitHub Actions workflow.

---

## Docker Commands

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f strapi

# Restart
docker-compose restart strapi

# Stop
docker-compose down
```

---

## Troubleshooting

### Port 1337 already in use

```bash
# On macOS/Linux
lsof -ti:1337 | xargs kill -9
```

### Can't connect to database

```bash
docker-compose ps  # check postgres is running
docker-compose up -d postgres
```
