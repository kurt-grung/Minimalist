# Minimalist CMS - Demo Project

This is a **demo and example project** showing how to use the Minimalist CMS package.

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Run the development server:**
```bash
npm run dev
```

3. **Access the admin panel:**
   - Visit `http://localhost:3000/admin` to access the admin interface
   - Visit `http://localhost:3000/cms` for the CMS interface (alternative route)

**Default credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important:** Change the default password in production! Update `users.json` with a hashed password.

## Features

- ✅ **Admin panel** with authentication
- ✅ **Multi-locale support** - Create and manage content in multiple languages
- ✅ **Create, edit, and delete posts** - Full CRUD operations
- ✅ **Rich text editor** - WYSIWYG editor with Markdown support
- ✅ **File-based content storage** - No database required
- ✅ **Static site generation** - Pre-rendered pages for performance
- ✅ **Settings management** - Configure site title, routes, and locales
- ✅ **Sitemap generation** - Automatic sitemap with locale support
- ✅ **API routes** - RESTful API for content management
- ✅ **Localhost-only admin** - Admin panel only accessible on localhost for security

## Project Structure

```
demo/
├── app/                    # Next.js app directory
│   ├── admin/              # Admin interface routes
│   │   ├── dashboard/      # Admin dashboard
│   │   │   ├── edit/       # Edit posts
│   │   │   ├── new/        # Create new posts
│   │   │   └── settings/   # Site settings
│   │   └── page.tsx        # Admin login
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication
│   │   ├── posts/          # Post management
│   │   └── settings/       # Settings API
│   ├── cms/                # Alternative CMS routes
│   ├── [...slug]/          # Dynamic content pages
│   └── page.tsx            # Homepage
├── components/              # React components
│   ├── RichTextEditor.tsx  # WYSIWYG/Markdown editor
│   ├── LocaleSelector.tsx  # Language switcher
│   └── ...
├── lib/                    # Library functions
│   ├── auth.ts             # Authentication
│   ├── config.ts           # Configuration
│   ├── content.ts          # Content management
│   └── storage.ts          # File storage
├── content/                # Content files
│   ├── posts/              # Blog posts
│   │   ├── en/             # English posts
│   │   ├── de/             # German posts
│   │   └── it/             # Italian posts
│   └── pages/              # Static pages
├── config.json             # Site configuration
└── users.json              # User credentials
```

## Configuration

Edit `config.json` to configure your site:

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

## Multi-Locale Support

The demo supports multiple languages:

- **Create posts in different locales** - Each locale has its own content directory
- **Locale-specific URLs** - Posts are accessible at `/{locale}/posts/{slug}`
- **Default locale fallback** - Default locale posts are also accessible without locale prefix
- **Locale selector** - Switch between languages on the frontend

## Content Storage

Content is stored as JSON files in the `content/` directory:

- **Posts**: `content/posts/{locale}/{slug}.json`
- **Pages**: `content/pages/{locale}/{slug}.json`

Example post structure:
```json
{
  "id": "post-123",
  "title": "My Post",
  "slug": "my-post",
  "content": "<p>Post content...</p>",
  "excerpt": "Short description",
  "date": "2024-01-01T00:00:00.000Z",
  "author": "John Doe"
}
```

## API Routes

### Authentication
- `POST /api/auth/login` - Login and get JWT token

### Posts
- `GET /api/posts?locale={locale}` - Get all posts for a locale
- `POST /api/posts` - Create a new post
- `GET /api/posts/[slug]?locale={locale}` - Get a specific post
- `PUT /api/posts/[slug]` - Update a post
- `DELETE /api/posts/[slug]?locale={locale}` - Delete a post

### Settings
- `GET /api/settings` - Get site configuration
- `PUT /api/settings` - Update site configuration

All POST, PUT, and DELETE requests require authentication via Bearer token.

## Development

### Build for production:
```bash
npm run build
```

### Run production server:
```bash
npm run start
```

### Static export (if needed):
```bash
npm run build:static
```

## Security Notes

- **Admin panel is localhost-only** - Only accessible when running on localhost
- **Change default password** - Update `users.json` with a bcrypt-hashed password
- **JWT tokens** - Used for API authentication
- **Content sanitization** - HTML content is sanitized before rendering

## Using the Package

This demo uses the local `minimalist` package. In your own projects, install it via npm:

```bash
npm install minimalist
npx minimalist init
```

## Documentation

- [Package README](../cms/README.md) - Package documentation
- [Installation Guide](../docs/INSTALLATION.md) - Setup instructions
- [Integration Guide](../docs/INTEGRATION.md) - How to integrate into your project
- [Roadmap](../docs/roadmap.md) - Planned features

## License

MIT

