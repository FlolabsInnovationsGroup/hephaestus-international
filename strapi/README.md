# Flo Labs Strapi CMS

Headless CMS for managing internships, projects, blog posts, and media for hephaestus.international.

## Quick Start

### 1. Generate Secrets

Generate secure secrets for production:

```bash
# Generate all secrets at once (macOS/Linux)
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

This will:
- Start PostgreSQL database on port 5433
- Start Strapi on http://localhost:1337
- Install dependencies automatically

### 3. Create Admin User

On first run, visit http://localhost:1337/admin and create your admin account.

### 4. Import WordPress Data

After creating the admin user:

```bash
cd ../scripts
npm install
node import-wordpress-to-strapi.js
```

## Managing Content

### Access Admin Panel

Visit <http://localhost:1337/admin> and login with your admin credentials.

### Content Types

- **Internships**: Manage internship positions (title, description, requirements, etc.)
- **Projects**: Showcase projects (MoodChanger, CAIPO, etc.)
- **Blog Posts**: Write and publish blog articles
- **Team Members**: Add team bios and photos
- **Media Library**: Upload and manage all images

### For Non-Technical Editors

1. **Login**: Go to <http://localhost:1337/admin>
2. **Navigate**: Click "Content Manager" in the left sidebar
3. **Choose Content Type**: Click on Internships, Projects, or Blog Posts
4. **Create Entry**: Click "+ Create new entry"
5. **Fill Fields**: 
   - Add title, description, images (drag & drop)
   - Set status (Draft/Published)
   - Click Save
6. **Publish**: Click "Publish" to make it live on the website

### Uploading Images

1. Click "Media Library" in the left sidebar
2. Click "Add new assets"
3. Drag and drop images or click to browse
4. Images are automatically optimized and available to use in content

## API Access

### Public Endpoints (no auth required)

- GET `/api/internships?populate=*` - List all internships
- GET `/api/projects?populate=*` - List all projects
- GET `/api/blog-posts?populate=*` - List all blog posts

### Authentication

For write operations (creating/updating content via API):

1. Go to Settings > API Tokens in Strapi admin
2. Create a new API token with appropriate permissions
3. Use in requests: `Authorization: Bearer YOUR_TOKEN`

## Development

### View Logs

```bash
docker-compose logs -f strapi
```

### Restart Strapi

```bash
docker-compose restart strapi
```

### Stop Services

```bash
docker-compose down
```

### Reset Database (careful!)

```bash
docker-compose down -v
docker-compose up -d
```

## Production Deployment

### Option 1: Railway (Recommended)

1. Push code to GitHub
2. Connect Railway to your repo
3. Add PostgreSQL database
4. Set environment variables from `.env.example`
5. Deploy

### Option 2: DigitalOcean App Platform

1. Create new App from Docker Hub or GitHub
2. Add managed PostgreSQL database
3. Set environment variables
4. Deploy

### Option 3: Strapi Cloud

1. Sign up at https://cloud.strapi.io
2. Connect your GitHub repo
3. Follow deployment wizard

## Environment Variables

Required for production:

```
JWT_SECRET=<secure-random-string>
ADMIN_JWT_SECRET=<secure-random-string>
APP_KEYS=<key1>,<key2>,<key3>,<key4>
API_TOKEN_SALT=<secure-random-string>
DATABASE_CLIENT=postgres
DATABASE_HOST=<your-db-host>
DATABASE_PORT=5432
DATABASE_NAME=<your-db-name>
DATABASE_USERNAME=<your-db-user>
DATABASE_PASSWORD=<your-db-password>
PUBLIC_URL=https://cms.yourdomain.com
```

## Troubleshooting

### Port already in use

If port 1337 is already in use:

```bash
# Kill process on port 1337
lsof -ti:1337 | xargs kill -9
```

Or change the port in `docker-compose.yml` (change `1337:1337` to `1338:1337`).

### Can't connect to database

Ensure PostgreSQL container is running:

```bash
docker-compose ps
```

If postgres is not running:

```bash
docker-compose up -d postgres
```

### Reset admin password

```bash
docker-compose exec strapi npm run strapi admin:reset-user-password -- --email=admin@example.com --password=NewPassword123
```

## Support

- Strapi Documentation: https://docs.strapi.io
- Discord: https://discord.strapi.io
