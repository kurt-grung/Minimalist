# Minimalist 

Minimalist CMS, No backend.

## Structure

```
minimalist/
├── cms/                  # Package
│   ├── src/              # Source
│   ├── templates/        # Templates
│   └── package.json
│
└── demo/                 # Example 
    ├── app/              # App
    ├── lib/              # Library
    └── package.json
```

## Quick Start

### Build Everything

From the repo root:

```bash
npm run build  # Builds CMS package and installs into demo
npm run dev    # Runs the demo
```

### Individual Commands

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

Visit `http://localhost:3000/cms` (default: admin/admin123)

## Using the Package

In your own Next.js project:

```bash
npm install minimalist-cms
npx minimalist-cms init
```

## Documentation

- [Package README](./cms/README.md) - Package documentation
- [Demo README](./demo/README.md) - Demo project guide
- [Installation Guide](./demo/INSTALLATION.md) - Setup instructions
- [Roadmap](./demo/roadmap.md) - Planned features
