# Minimalist - Complete Integration Guide

## ✅ What Gets Installed

When you run `npx minimalist init`, the package automatically sets up a **complete, working CMS** in your Next.js project. Here's everything that gets added:

### 📁 Files Created

#### **API Routes** (Backend)
- `app/api/auth/login/route.ts` - Authentication endpoint
- `app/api/posts/route.ts` - Get all posts, create new post
- `app/api/posts/[slug]/route.ts` - Get, update, delete specific post
- `app/api/settings/route.ts` - Site configuration management

#### **Admin Interface** (Frontend)
- `app/admin/page.tsx` - Login page
- `app/admin/dashboard/page.tsx` - Full admin dashboard with:
  - Post list and management
  - Rich text editor for creating/editing posts
  - Settings management
  - Authentication

#### **Frontend Pages**
- `app/page.tsx` - Homepage displaying all posts
- `app/[...slug]/page.tsx` - Dynamic routes for posts and pages
- `app/sitemap.ts` - Automatic sitemap generation

#### **Components**
- `components/RichTextEditor.tsx` - Full-featured WYSIWYG editor
- `components/Footer.tsx` - Footer component

#### **Library Files** (Core Functionality)
- `lib/auth.ts` - Authentication (JWT, password hashing)
- `lib/config.ts` - Site configuration management
- `lib/content.ts` - Content CRUD operations
- `lib/storage.ts` - Storage adapter (files + Vercel KV)

#### **Configuration**
- `config.json` - Site settings (created if missing)
- `users.json` - User authentication (created if missing)
- `content/` - Directory structure for posts and pages
- `tsconfig.json` - Updated with `@/*` path alias

#### **Styles**
- `app/globals.css` - Complete CSS including rich text editor styles

## 🚀 Installation Process

### Step 1: Install Package
```bash
npm install minimalist
```

### Step 2: Initialize CMS
```bash
npx minimalist init
```

This command:
- ✅ Copies all template files
- ✅ Creates directory structure
- ✅ Sets up configuration files
- ✅ Updates tsconfig.json
- ✅ Updates .gitignore

### Step 3: Install Dependencies
The CLI will guide you to install:

**Core Dependencies:**
```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

**Tailwind CSS (for styling):**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Note:** The Rich Text Editor is built from scratch with no external dependencies. Tailwind CSS is used for styling the editor UI.

### Step 4: Start Development
```bash
npm run dev
```

### Step 5: Access Admin Panel
Visit `http://localhost:3000/admin`

**Default credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change the default password in production!**

## ✨ What You Get Out of the Box

### Complete CMS Features
- ✅ **Admin Panel** - Full UI for content management
- ✅ **Authentication** - JWT-based login system
- ✅ **Rich Text Editor** - WYSIWYG + Markdown modes
- ✅ **Post Management** - Create, edit, delete posts
- ✅ **Settings** - Configure site title, routes, etc.
- ✅ **File Storage** - Works in development (files) and production (Vercel KV)
- ✅ **Sitemap** - Automatic sitemap generation
- ✅ **TypeScript** - Fully typed
- ✅ **Production Ready** - Works on Vercel, Netlify, etc.

### Rich Text Editor Features
- ✅ **Built from scratch** - No external WYSIWYG libraries
- ✅ Bold, Italic formatting
- ✅ Headings (H1, H2, H3)
- ✅ Bullet and numbered lists
- ✅ Block quotes
- ✅ Code blocks with **custom syntax highlighting** (no highlight.js needed)
- ✅ Link insertion
- ✅ Markdown mode toggle
- ✅ Backward compatible with plain text
- ✅ Zero external dependencies for the editor

## 📦 Package Structure

The `minimalist` package includes:

```
minimalist/
├── dist/              # Compiled JavaScript
├── templates/         # Template files (copied on init)
│   └── nextjs/
│       ├── app/       # Pages and API routes
│       ├── components/# React components
│       └── lib/       # Core library files
└── src/              # TypeScript source
    ├── lib/          # Core functionality
    └── cli/          # CLI tool
```

## 🔧 How It Works

1. **Package Installation**: The npm package contains the CLI tool and templates
2. **Initialization**: `npx minimalist init` copies templates to your project
3. **Library Files**: Core functionality is copied as local files (not imported from package)
4. **Dependencies**: You install required npm packages separately
5. **Ready to Use**: Everything works immediately after dependencies are installed

## 🎯 Why This Approach?

### ✅ Advantages
- **Self-contained**: All code is in your project (easy to customize)
- **No magic**: You can see and modify everything
- **Type-safe**: Full TypeScript support
- **Flexible**: Easy to extend and customize
- **Production-ready**: Works on all platforms

### 📝 Note
The library files (`lib/`) are copied to your project rather than imported from the package. This allows you to:
- Customize the behavior
- See exactly what's happening
- Modify storage, auth, or content logic
- Not worry about package version conflicts

## 🚨 Important Notes

1. **Path Alias**: The package sets up `@/*` path alias in `tsconfig.json`. If you already have one, it will be preserved.

2. **Existing Files**: The CLI won't overwrite existing files. If you already have `app/page.tsx`, it won't be replaced.

3. **Dependencies**: You must install the dependencies listed by the CLI for everything to work.

4. **Production**: For Vercel deployment, you'll need to set up Vercel KV (optional, falls back to files).

5. **Security**: Always change the default admin password before deploying to production!

## 📚 Next Steps

After installation:
1. Customize the homepage (`app/page.tsx`)
2. Style the admin panel to match your brand
3. Add more content types if needed
4. Configure deployment settings
5. Set up environment variables for production

## 🆘 Troubleshooting

**Issue**: "Module not found: @/lib/..."
**Solution**: Make sure `tsconfig.json` has the `@/*` path alias configured.

**Issue**: Rich text editor not working
**Solution**: The editor is built from scratch with no dependencies. If you see errors, make sure `components/syntaxHighlighter.ts` was copied correctly.

**Issue**: Authentication not working
**Solution**: Make sure `bcryptjs` and `jsonwebtoken` are installed.

**Issue**: Can't save posts
**Solution**: Check that `content/` directory exists and is writable (or set up Vercel KV for production).

---

**The CMS is designed to be easy to use - just install, initialize, and start creating content!** 🎉

