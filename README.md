# Minimalist CMS

Minimal headless CMS. No database required. Content is stored as files.

## Features

- ✅ **File-based storage** - No database needed
- ✅ **Multi-locale support** - Create content in multiple languages
- ✅ **TypeScript support** - Full TypeScript definitions
- ✅ **Vercel KV support** - Automatic fallback to Vercel KV in production
- ✅ **JWT authentication** - Secure admin authentication
- ✅ **Zero configuration** - Works out of the box
- ✅ **Static site generation** - Perfect for Next.js static exports
- ✅ **Rich text editor** - WYSIWYG editor with Markdown support
- ✅ **Image management** - Upload, manage, and insert images in posts
- ✅ **Responsive grid layout** - Beautiful post grid with uniform card sizes and full background images
- ✅ **Full-text search** - Search across posts and pages with relevance ranking
- ✅ **Modern card design** - Uniform card sizes with consistent text positioning, gradient overlays, and white background fallback

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
# Build CMS package and install demo dependencies
npm run build

# Build both CMS package and demo app
npm run build:all

# Run the demo
npm run dev
```

Or individually:

```bash
# Build CMS package only
npm run build:package

# Build demo app only
npm run build:demo

# Run demo
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

## Testing

### CMS Package Tests
Unit tests are available for the CMS package:
```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

See [CMS Tests README](./cms/tests/README.md) for more details.

### Pre-commit Hooks
The project uses Husky to run checks before commits:
- ✅ **Tests CMS package** - Runs unit tests for the CMS package
- ✅ **Tests demo app** - Runs unit tests for the demo app
- ✅ Demo app TypeScript type checking
- ✅ CMS package build verification
- ✅ Demo app build verification

**Summary:** Pre-commit hook tests both CMS package and demo app, then builds both to ensure everything works.

This ensures tests pass, TypeScript errors and build issues are caught before commit. See [Git Hooks README](./.husky/README.md) for details.

### Demo App Tests
Unit tests are available for the demo app:
```bash
# Run tests
cd demo && npm test

# Watch mode
cd demo && npm run test:watch

# With coverage
cd demo && npm run test:coverage
```

See [Demo Tests README](./demo/tests/README.md) for more details.

## Documentation

- [Package README](./cms/README.md) - Complete API documentation
- [Demo README](./demo/README.md) - Demo project guide
- [Installation Guide](./demo/INSTALLATION.md) - Setup instructions
- [Roadmap](./ROADMAP.md) - Planned features and enhancements
- [Git Hooks](./.husky/README.md) - Pre-commit hook documentation

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

### Search Example

```typescript
// Search API endpoint
const response = await fetch('/api/search?q=your+query&locale=en&type=all')
const { results, query, total } = await response.json()

// Results are sorted by relevance score
results.forEach(result => {
  console.log(result.title, result.relevance)
})
```

## License

MIT
