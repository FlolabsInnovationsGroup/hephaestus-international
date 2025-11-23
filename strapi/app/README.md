# Flo Labs Strapi CMS Application

Strapi v5.31.0 headless CMS for managing Hephaestus.International content.

## Quick Start

### Prerequisites
- Node.js 18-20 (use `nvm use 20` if using nvm)
- PostgreSQL database (Railway provides this in production)

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` file:

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

Open [http://localhost:1337/admin](http://localhost:1337/admin) to access the admin panel.

### Production

```bash
npm run build
npm start
```

## Content Types

This Strapi instance manages:

### Collection Types
- **Internship** (39 entries) - Internship positions with applications
- **Project** (8 entries) - Showcase projects
- **Blog Post** (13 entries) - Blog articles
- **Benefit** - Homepage benefits section
- **Vertical** - Homepage verticals section  
- **Methodology Item** - Homepage methodology steps
- **Section Content** - Dynamic page sections
- **Intern** - Team member profiles

### Single Types
- **Site Setting** - Global site configuration

## API Endpoints

### Public Endpoints

```
GET /api/internships?populate=*
GET /api/internships?filters[slug][$eq]=slug-name&populate=*
GET /api/projects?populate=*&sort=order:asc
GET /api/blog-posts?populate=*&sort=publishedDate:desc
GET /api/benefits?populate=*&sort=order:asc
GET /api/verticals?populate=*&sort=order:asc
GET /api/site-setting?populate=*
```

### Authentication

Create API tokens in: **Settings → API Tokens → Create new API Token**

Use in requests:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Content Management

### For Content Editors

See **[CMS_USER_GUIDE.md](../../CMS_USER_GUIDE.md)** for detailed instructions.

### For Developers

#### Adding New Content Types

1. Use Content-Type Builder in admin panel
2. Define fields and relationships
3. Set permissions in Settings → Roles → Public
4. Add API function in `frontend/lib/strapi.ts`
5. Add TypeScript interface in `frontend/lib/types.ts`

#### Media Library

Images are stored in `/public/uploads/` locally and in Railway storage in production.

## Database

PostgreSQL 16 database:
- **Local**: Configure in `.env`
- **Production**: Railway managed database

### Migrations

Migrations are stored in `database/migrations/` and run automatically.

## Deployment

### Railway (Production)

Auto-deploys from `main` branch.

**Required Environment Variables:**
- `DATABASE_URL` (provided by Railway)
- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `JWT_SECRET`
- `TRANSFER_TOKEN_SALT`

### Admin Panel Access

Production: https://strapi-production-7ecb.up.railway.app/admin

## Scripts

```bash
npm run develop  # Development with admin UI and hot reload
npm run start    # Production mode
npm run build    # Build admin panel
npm run strapi   # Strapi CLI commands
```

## Troubleshooting

### Can't Access Admin Panel

- Check Strapi is running: `http://localhost:1337/admin`
- Clear browser cache
- Try incognito/private window

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure database exists

### Reset Admin Password

Run from the `strapi/app` directory:

```bash
node reset-admin.js
```

## Documentation

- **[Strapi Documentation](https://docs.strapi.io)** - Official Strapi docs
- **[DEVELOPER_GUIDE.md](../../DEVELOPER_GUIDE.md)** - Project developer guide
- **[CMS_USER_GUIDE.md](../../CMS_USER_GUIDE.md)** - Content editor guide

## Support

- **Strapi Discord**: https://discord.strapi.io
- **GitHub Issues**: Create issues for bugs/features
