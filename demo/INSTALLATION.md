# Installation Guide

## For End Users (Installing the Package)

### Quick Start

```bash
# In your Next.js project
npm install headless-cms
npx headless-cms init
npm run dev
```

Visit `http://localhost:3000/admin` and login with:
- Username: `admin`
- Password: `admin123`

### Manual Installation

If you prefer to set up manually:

1. **Install the package:**
```bash
npm install headless-cms
```

2. **Create API routes:**
   Copy the templates from `node_modules/headless-cms/templates/nextjs/app/api/` to your `app/api/` directory.

3. **Create middleware:**
   Copy `node_modules/headless-cms/templates/nextjs/middleware.ts` to your project root.

4. **Create directories:**
```bash
mkdir -p content/posts content/pages
```

5. **Create configuration files:**
   - `users.json` - User authentication
   - `config.json` - Site configuration

See the [package README](./packages/headless-cms/README.md) for detailed API documentation.

## For Developers (Working on the Package)

### Setup

1. **Clone the repository:**
```bash
git clone <repo-url>
cd headless
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the package:**
```bash
cd packages/headless-cms
npm run build
```

### Local Development

To test the package locally in the demo project:

```bash
# From packages/headless-cms
npm link

# From root directory
npm link headless-cms
```

### Publishing

1. **Update version:**
   Edit `packages/headless-cms/package.json` and increment the version.

2. **Build:**
```bash
cd packages/headless-cms
npm run build
```

3. **Publish:**
```bash
npm publish
```

## Project Structure

- **`packages/headless-cms/`** - The npm package
- **Root directory** - Demo/example project
- **`lib/`** - Demo uses local lib files (can be switched to package)

## Next Steps

- Read the [package README](./packages/headless-cms/README.md) for API documentation
- Check the [roadmap](./roadmap.md) for planned features
- See [PACKAGE_STRUCTURE.md](./PACKAGE_STRUCTURE.md) for development details

