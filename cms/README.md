# Minimalist CMS

A simple, file-based headless CMS package for Next.js and Nuxt.js projects. No database required - content is stored as JSON files.

## Features

- ✅ **File-based storage** - No database needed
- ✅ **Multi-locale support** - Create content in multiple languages
- ✅ **TypeScript support** - Full TypeScript definitions
- ✅ **Vercel KV support** - Automatic fallback to Vercel KV in production
- ✅ **JWT authentication** - Secure admin authentication
- ✅ **Zero configuration** - Works out of the box
- ✅ **Static site generation** - Perfect for Next.js static exports

## Installation

```bash
npm install minimalist
```

## Quick Start

### Next.js

1. **Initialize the CMS in your Next.js project:**

```bash
npx minimalist init
```

This will:
- Create the necessary API routes
- Set up admin pages
- Create default configuration files
- Set up authentication

2. **Start your development server:**

```bash
npm run dev
```

3. **Access the admin panel:**

Visit `http://localhost:3000/admin`

**Default credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change the default password in production!**

## Usage

### Import the library

```typescript
import { 
  getAllPosts, 
  getPostBySlug, 
  savePost, 
  deletePost,
  Post 
} from 'minimalist'
```

### Content Management

#### Get all posts

```typescript
// Get all posts (legacy - from all locales)
const posts = await getAllPosts()

// Get posts for a specific locale
const posts = await getAllPosts('en')
```

#### Get a single post

```typescript
// Get post by slug (tries default locale, then falls back)
const post = await getPostBySlug('my-post')

// Get post for a specific locale
const post = await getPostBySlug('my-post', 'en')
```

#### Create or update a post

```typescript
const post: Post = {
  id: 'post-123',
  title: 'My Post',
  slug: 'my-post',
  content: '<p>Post content...</p>',
  excerpt: 'Short description',
  date: new Date().toISOString(),
  author: 'John Doe'
}

// Save post (creates if new, updates if exists)
await savePost(post)

// Save post for a specific locale
await savePost(post, 'en')
```

#### Delete a post

```typescript
// Delete post (tries default locale)
await deletePost('my-post')

// Delete post for a specific locale
await deletePost('my-post', 'en')
```

### Pages

Pages work similarly to posts:

```typescript
import { getAllPages, getPageBySlug, savePage, deletePage, Page } from 'minimalist'

// Get all pages
const pages = await getAllPages('en')

// Get a page
const page = await getPageBySlug('about', 'en')

// Save a page
const page: Page = {
  id: 'page-1',
  title: 'About',
  slug: 'about',
  content: '<p>About content...</p>'
}
await savePage(page, 'en')

// Delete a page
await deletePage('about', 'en')
```

### Configuration

```typescript
import { getConfig, updateConfig, SiteConfig } from 'minimalist'

// Get current configuration
const config = getConfig()

// Update configuration
const newConfig = updateConfig({
  siteTitle: 'My New Blog',
  postRoute: 'blog',
  defaultLocale: 'en',
  locales: [
    { code: 'en', name: 'English', enabled: true },
    { code: 'de', name: 'German', enabled: true }
  ]
})
```

### Authentication

```typescript
import { verifyPassword, createToken, verifyToken } from 'minimalist'

// Get user and verify password
import { getUser, verifyPassword } from 'minimalist'
const user = getUser('admin')
const isValid = user ? verifyPassword('admin123', user.passwordHash) : false

// Generate JWT token
const token = createToken('admin')

// Verify token
const payload = verifyToken(token)
if (payload) {
  console.log('Authenticated user:', payload.username)
}
```

### Storage

The package automatically uses:
- **File system** in development
- **Vercel KV** in production (if `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set)

You can also use storage functions directly:

```typescript
import { storageGet, storageSet, storageDelete, storageList } from 'minimalist'

// Get a value
const value = await storageGet('content/posts/en/my-post.json')

// Set a value
await storageSet('content/posts/en/my-post.json', JSON.stringify(post))

// Delete a value
await storageDelete('content/posts/en/my-post.json')

// List keys
const keys = await storageList('content/posts/en/')
```

## API Reference

### Content Functions

#### `getAllPosts(locale?: string): Promise<Post[]>`
Get all posts. If `locale` is provided, returns posts for that locale only.

#### `getPostBySlug(slug: string, locale?: string): Promise<Post | null>`
Get a post by slug. Tries the specified locale, then falls back to default locale.

#### `savePost(post: Post, locale?: string): Promise<boolean>`
Save a post. Creates if new, updates if exists. Returns `true` on success.

#### `deletePost(slug: string, locale?: string): Promise<boolean>`
Delete a post by slug. Returns `true` on success.

#### `getAllPages(locale?: string): Promise<Page[]>`
Get all pages for a locale.

#### `getPageBySlug(slug: string, locale?: string): Promise<Page | null>`
Get a page by slug.

#### `savePage(page: Page, locale?: string): Promise<boolean>`
Save a page.

#### `deletePage(slug: string, locale?: string): Promise<boolean>`
Delete a page.

### Configuration Functions

#### `getConfig(): SiteConfig`
Get the current site configuration.

#### `updateConfig(config: Partial<SiteConfig>): SiteConfig`
Update the site configuration. Returns the updated config.

#### `getEnabledLocales(): Locale[]`
Get all enabled locales.

#### `getLocaleByCode(code: string): Locale | undefined`
Get a locale by its code.

### Authentication Functions

#### `verifyPassword(password: string, hash: string): boolean`
Verify a password against a hash. Returns `true` if valid.

#### `createToken(username: string): string`
Create a JWT token for a user.

#### `verifyToken(token: string): { username: string } | null`
Verify a JWT token. Returns the payload if valid, `null` otherwise.

#### `initDefaultUser(): void`
Initialize the default admin user if `users.json` doesn't exist.

### Storage Functions

#### `storageGet(key: string): Promise<string | null>`
Get a value from storage.

#### `storageSet(key: string, value: string): Promise<boolean>`
Set a value in storage.

#### `storageDelete(key: string): Promise<boolean>`
Delete a value from storage.

#### `storageList(prefix: string): Promise<string[]>`
List all keys with the given prefix.

#### `storageExists(key: string): Promise<boolean>`
Check if a key exists in storage.

## Types

### Post

```typescript
interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date: string
  author?: string
}
```

### Page

```typescript
interface Page {
  id: string
  title: string
  slug: string
  content: string
}
```

### SiteConfig

```typescript
interface SiteConfig {
  siteTitle: string
  siteSubtitle: string
  postRoute: string
  pageRoute: string
  defaultLocale: string
  locales: Locale[]
}

interface Locale {
  code: string
  name: string
  enabled: boolean
}
```

## Multi-Locale Support

The package supports multiple languages out of the box:

```typescript
// Configure locales in config.json
{
  "defaultLocale": "en",
  "locales": [
    { "code": "en", "name": "English", "enabled": true },
    { "code": "de", "name": "German", "enabled": true },
    { "code": "it", "name": "Italian", "enabled": true }
  ]
}

// Get posts for a specific locale
const englishPosts = await getAllPosts('en')
const germanPosts = await getAllPosts('de')

// Save post for a specific locale
await savePost(post, 'en')
await savePost(post, 'de')
```

Content is stored in locale-specific directories:
- `content/posts/en/my-post.json`
- `content/posts/de/my-post.json`
- `content/posts/it/my-post.json`

## Storage Backends

### File System (Development)

In development, content is stored as JSON files in the `content/` directory:

```
content/
├── posts/
│   ├── en/
│   │   ├── my-post.json
│   │   └── another-post.json
│   └── de/
│       └── mein-post.json
└── pages/
    └── en/
        └── about.json
```

### Vercel KV (Production)

In production on Vercel, if `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set, the package automatically uses Vercel KV for storage. This allows the CMS to work on Vercel's read-only filesystem.

To enable Vercel KV:
1. Create a Vercel KV database in your Vercel dashboard
2. Add the environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

The package will automatically detect these and use KV instead of the file system.

## Environment Variables

- `JWT_SECRET` - Secret key for JWT tokens (default: `'your-secret-key-change-in-production'`)
- `ADMIN_PASSWORD` - Default admin password (default: `'admin123'`)
- `KV_REST_API_URL` - Vercel KV REST API URL (optional, for production)
- `KV_REST_API_TOKEN` - Vercel KV REST API token (optional, for production)

## CLI

The package includes a CLI tool for initialization:

```bash
npx minimalist init
```

This sets up:
- API routes for content management
- Admin pages
- Default configuration
- Authentication setup

## Examples

See the [demo project](../demo/) for a complete working example.

## License

MIT

