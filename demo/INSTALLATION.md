# Installation Guide

This guide will help you set up the Minimalist CMS demo project.

## Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

## Quick Start

### Option 1: Using the Package (Recommended)

If you want to use Minimalist CMS in your own Next.js project:

1. **Install the package:**
```bash
npm install minimalist
```

2. **Initialize the CMS:**
```bash
npx minimalist init
```

This will automatically:
- Create API routes in `app/api/`
- Set up admin pages in `app/admin/`
- Create default configuration files
- Set up authentication

3. **Start your development server:**
```bash
npm run dev
```

4. **Access the admin panel:**
   - Visit `http://localhost:3000/admin`
   - Default credentials:
     - Username: `admin`
     - Password: `admin123`

⚠️ **Important:** Change the default password in production!

### Option 2: Running the Demo Project

If you want to run the demo project from this repository:

1. **Clone the repository:**
```bash
git clone https://github.com/kurt-grung/minimalist.git
cd minimalist
```

2. **Install dependencies:**
```bash
# Install root dependencies
npm install

# Build the CMS package
cd cms
npm install
npm run build

# Install demo dependencies
cd ../demo
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Access the admin panel:**
   - Visit `http://localhost:3000/admin`
   - Default credentials:
     - Username: `admin`
     - Password: `admin123`

## Manual Setup

If you prefer to set up manually or the CLI doesn't work:

### 1. Install the Package

```bash
npm install minimalist
```

### 2. Create API Routes

Copy the API route templates from the package:

```bash
# Copy API routes
cp -r node_modules/minimalist/templates/nextjs/app/api/* app/api/

# Copy admin pages (optional - if you want the admin interface)
cp -r node_modules/minimalist/templates/nextjs/app/admin/* app/admin/
```

Or manually create the following API routes:

#### `app/api/auth/login/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, generateToken } from 'minimalist'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  
  const isValid = await verifyPassword(username, password)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  
  const token = generateToken(username)
  return NextResponse.json({ token })
}
```

#### `app/api/posts/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts, savePost, Post } from 'minimalist'
import { verifyToken } from 'minimalist'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') || undefined
  const posts = await getAllPosts(locale)
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  // Add authentication check
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const data = await request.json()
  const post: Post = {
    id: data.id || `post-${Date.now()}`,
    title: data.title,
    slug: data.slug,
    content: data.content,
    excerpt: data.excerpt || '',
    date: data.date || new Date().toISOString(),
    author: data.author || ''
  }
  
  await savePost(post, data.locale)
  return NextResponse.json(post, { status: 201 })
}
```

### 3. Create Content Directories

```bash
mkdir -p content/posts content/pages
```

### 4. Create Configuration Files

#### `config.json`
```json
{
  "siteTitle": "My Blog",
  "siteSubtitle": "Welcome to our simple file-based CMS",
  "postRoute": "posts",
  "pageRoute": "",
  "defaultLocale": "en",
  "locales": [
    { "code": "en", "name": "English", "enabled": true }
  ]
}
```

#### `users.json`
```json
[
  {
    "username": "admin",
    "passwordHash": "$2a$10$..."
  }
]
```

To generate a password hash, you can use:
```typescript
import bcrypt from 'bcryptjs'
const hash = bcrypt.hashSync('your-password', 10)
console.log(hash)
```

Or use the default admin user (username: `admin`, password: `admin123`) which will be created automatically on first run.

## Configuration

### Site Configuration (`config.json`)

```json
{
  "siteTitle": "My Blog",
  "siteSubtitle": "Welcome to our simple file-based CMS",
  "postRoute": "posts",
  "pageRoute": "",
  "defaultLocale": "en",
  "locales": [
    { "code": "en", "name": "English", "enabled": true },
    { "code": "de", "name": "German", "enabled": true },
    { "code": "it", "name": "Italian", "enabled": true }
  ]
}
```

- **siteTitle**: The title of your site
- **siteSubtitle**: Subtitle displayed on the homepage
- **postRoute**: URL prefix for posts (e.g., "posts" = `/posts/[slug]`)
- **pageRoute**: URL prefix for pages (empty for root)
- **defaultLocale**: Default language code
- **locales**: Array of available locales

### Environment Variables

Create a `.env.local` file (optional):

```env
# JWT Secret (change in production!)
JWT_SECRET=your-secret-key-change-in-production

# Default admin password (only used if users.json doesn't exist)
ADMIN_PASSWORD=admin123

# Vercel KV (for production on Vercel)
KV_REST_API_URL=https://your-kv-instance.vercel.app
KV_REST_API_TOKEN=your-kv-token
```

## Multi-Locale Setup

To enable multiple languages:

1. **Update `config.json`:**
```json
{
  "defaultLocale": "en",
  "locales": [
    { "code": "en", "name": "English", "enabled": true },
    { "code": "de", "name": "German", "enabled": true },
    { "code": "it", "name": "Italian", "enabled": true }
  ]
}
```

2. **Create locale directories:**
```bash
mkdir -p content/posts/en content/posts/de content/posts/it
mkdir -p content/pages/en content/pages/de content/pages/it
```

3. **Content will be stored per locale:**
   - `content/posts/en/my-post.json`
   - `content/posts/de/my-post.json`
   - `content/posts/it/my-post.json`

## Production Deployment

### Vercel

1. **Set up Vercel KV (optional but recommended):**
   - Create a Vercel KV database in your Vercel dashboard
   - Add environment variables:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`

2. **Set environment variables:**
   - `JWT_SECRET` - Use a strong random secret
   - `ADMIN_PASSWORD` - Set a secure password

3. **Deploy:**
```bash
vercel deploy
```

The package will automatically use Vercel KV in production if the environment variables are set.

### Other Platforms

For other hosting platforms:

1. **Ensure write access:**
   - The `content/` directory must be writable
   - Or use a storage adapter (Vercel KV, S3, etc.)

2. **Set environment variables:**
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`

3. **Build and deploy:**
```bash
npm run build
npm run start
```

## Security Checklist

- [ ] Change default admin password
- [ ] Set a strong `JWT_SECRET` environment variable
- [ ] Restrict admin panel access (localhost-only by default)
- [ ] Use HTTPS in production
- [ ] Regularly backup `content/` directory
- [ ] Review and sanitize user-generated content

## Troubleshooting

### Admin panel not accessible

- Ensure you're accessing from `localhost` (admin panel is localhost-only by default)
- Check that API routes are properly set up
- Verify `users.json` exists and has valid user data

### Posts not saving

- Check file permissions on `content/` directory
- Verify storage backend is working (file system or Vercel KV)
- Check browser console for errors

### Locale issues

- Ensure locale directories exist: `content/posts/{locale}/`
- Verify locale is enabled in `config.json`
- Check that locale code matches directory name

## Next Steps

- Read the [Demo README](./README.md) for usage examples
- Check the [Package README](../cms/README.md) for API documentation
- See the [Roadmap](../docs/roadmap.md) for planned features

## Getting Help

- Check the [documentation](../docs/)
- Review the [demo project](./) for examples
- Open an issue on [GitHub](https://github.com/kurt-grung/minimalist)

