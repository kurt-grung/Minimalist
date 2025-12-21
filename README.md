# Minimalist, Headless CMS

Minimalist, Headless CMS, No backend.

## Structure

```
headless/
├── headless-cms/         # 📦 The npm package
│   ├── src/              # TypeScript source
│   ├── templates/        # Framework templates
│   └── package.json
│
└── demo/                 # 🎨 Demo/Example project
    ├── app/              # Next.js app
    ├── lib/              # Local library
    └── package.json      # References ../headless-cms
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
cd headless-cms
npm install
npm run build

# Run demo only
cd demo
npm install
npm run dev
```

Visit `http://localhost:3000/admin` (default: admin/admin123)

## Using the Package

In your own Next.js project:

```bash
npm install headless-cms
npx headless-cms init
```

## Documentation

- [Package README](./headless-cms/README.md) - Package documentation
- [Demo README](./demo/README.md) - Demo project guide
- [Installation Guide](./demo/INSTALLATION.md) - Setup instructions
- [Roadmap](./demo/roadmap.md) - Planned features

## License

MIT
