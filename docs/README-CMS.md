# Headless CMS

A simple, file-based headless CMS package for Next.js and Nuxt.js projects.

## Installation

```bash
npm install headless-cms
```

## Quick Start

### Next.js

1. Initialize the CMS in your Next.js project:

```bash
npx headless-cms init
```

2. Start your development server:

```bash
npm run dev
```

3. Access the admin panel at `/admin`

**Default credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change the default password in production!**

## Usage

### Import the library

```typescript
import { getAllPosts, getPostBySlug, savePost, Post } from 'headless-cms'
```

### Get all posts

```typescript
const posts = await getAllPosts()
```

### Save a post

```typescript
const post: Post = {
  id: 'post-123',
  title: 'My Post',
  slug: 'my-post',
  content: 'Post content...',
  excerpt: 'Short description',
  date: new Date().toISOString(),
  author: 'John Doe'
}

await savePost(post)
```

## API Reference

See the full documentation in the [package README](./README.md) or check out the [demo project](../headless-cms-demo/) for examples.

## License

MIT
