# Minimalist CMS

A simple, file-based headless CMS for Next.js. No database required—content is stored as JSON files.

## Features

- ✅ **File-based storage** - No database needed
- ✅ **Multi-locale support** - Create content in multiple languages
- ✅ **TypeScript support** - Full TypeScript definitions
- ✅ **Vercel KV support** - Automatic fallback to Vercel KV in production
- ✅ **JWT authentication** - Secure admin authentication
- ✅ **Zero configuration** - Works out of the box
- ✅ **Static site generation** - Perfect for Next.js static exports
- ✅ **Rich text editor** - WYSIWYG editor with Markdown support

## Project Structure

```
minimalist/
├── cms/                  # NPM Package
│   ├── src/              # Source code
│   ├── templates/        # Next.js templates
│   └── package.json
│
└── demo/                 # Example/Demo project
    ├── app/              # Next.js app directory
    ├── lib/              # Library functions
    ├── content/          # Content files (posts, pages)
    └── package.json
```

## Quick Start

### Using the Package

In your own Next.js project:

```bash
npm install minimalist
npx minimalist init
npm run dev
```

Visit `http://localhost:3000/admin` (default credentials: `admin` / `admin123`)

### Running the Demo

From the repo root:

```bash
# Build CMS package and install into demo
npm run build

# Run the demo
npm run dev
```

Or individually:

```bash
# Build package only
cd cms
npm install
npm run build

# Run demo only
cd demo
npm install
npm run dev
```

**Access points:**
- Admin panel: `http://localhost:3000/admin`
- CMS interface: `http://localhost:3000/cms`
- Default credentials: `admin` / `admin123`

## Installation

See the [Installation Guide](./demo/INSTALLATION.md) for detailed setup instructions.

## Documentation

- [Package README](./cms/README.md) - Complete API documentation
- [Demo README](./demo/README.md) - Demo project guide
- [Installation Guide](./demo/INSTALLATION.md) - Setup instructions
- [Roadmap](./ROADMAP.md) - Planned features and enhancements

## Usage Example

```typescript
import { getAllPosts, savePost, Post } from 'minimalist'

// Get all posts
const posts = await getAllPosts('en')

// Create a post
const post: Post = {
  id: 'post-123',
  title: 'My Post',
  slug: 'my-post',
  content: '<p>Post content...</p>',
  excerpt: 'Short description',
  date: new Date().toISOString(),
  author: 'John Doe'
}

await savePost(post, 'en')
```

## License

MIT
