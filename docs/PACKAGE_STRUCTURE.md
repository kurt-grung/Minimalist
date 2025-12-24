# Package Structure

This repository is structured as a **monorepo** containing both the installable npm package and a demo/example project.

## Structure

```
headless/
├── packages/
│   └── cms/              # The npm package
│       ├── src/                    # TypeScript source code
│       │   ├── lib/               # Core library (storage, auth, content, config)
│       │   ├── cli/               # CLI tool for initialization
│       │   └── index.ts           # Main entry point
│       ├── templates/             # Framework-specific templates
│       │   └── nextjs/           # Next.js API routes
│       ├── dist/                  # Compiled output (generated)
│       ├── package.json           # Package configuration
│       ├── tsconfig.json          # TypeScript config
│       └── README.md              # Package documentation
│
├── app/                           # Demo Next.js app
├── lib/                           # Demo uses local lib (can switch to package)
├── content/                       # Demo content files
├── package.json                   # Demo project config
└── README.md                      # This demo project's README
```

## Package Development

### Building the Package

```bash
cd packages/cms
npm run build
```

This compiles TypeScript from `src/` to `dist/`.

### Publishing

1. Update version in `packages/cms/package.json`
2. Build: `npm run build`
3. Publish: `npm publish` (from package directory)

### Local Development

To test the package locally:

```bash
# From packages/cms
npm link

# From root directory
npm link headless-cms
```

## Package Contents

### Core Library (`src/lib/`)

- **storage.ts** - Storage adapter (file system / Vercel KV)
- **auth.ts** - Authentication (JWT, bcrypt)
- **content.ts** - Content management (posts, pages)
- **config.ts** - Site configuration

### CLI (`src/cli/`)

- **index.ts** - Initialization script
- **cli.js** - CommonJS wrapper for bin entry

### Templates (`templates/nextjs/`)

- **app/api/** - API route templates

## Usage

### As a Package

```bash
npm install headless-cms
npx headless-cms init
```

### As a Demo

```bash
npm install
npm run dev
```

## Future: Nuxt Support

The package structure is designed to support multiple frameworks:

```
templates/
├── nextjs/        # ✅ Current
└── nuxt/          # 🚧 Planned
```

## Notes

- The demo project currently uses local `lib/` files
- The package is in `packages/cms/`
- Both share the same core functionality
- The demo can be updated to use the package once published

