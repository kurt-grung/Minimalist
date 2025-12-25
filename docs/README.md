# Minimalist - Demo Project

This is a **demo and example project** showing how to use the Minimalist CMS package.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Visit `http://localhost:3000/admin` to access the admin panel

**Default credentials:**
- Username: `admin`
- Password: `admin123`

## Using the Package

This demo uses the local `minimalist` package. In your own projects, install it via npm:

```bash
npm install minimalist
npx minimalist init
```

## Project Structure

```
minimalist-demo/
├── app/              # Next.js app
│   ├── admin/       # Admin interface
│   ├── api/         # API routes
│   └── ...
├── lib/             # Local library (demo uses this)
├── content/         # Content files
└── components/      # React components
```

## Features Demonstrated

- ✅ Admin panel with authentication
- ✅ Create, edit, and delete posts
- ✅ File-based content storage
- ✅ Static site generation
- ✅ Settings management
- ✅ Sitemap generation

## Documentation

- See the [package README](../cms/README.md) for API documentation
- Check [INSTALLATION.md](./INSTALLATION.md) for setup instructions
- See [roadmap.md](./roadmap.md) for planned features

## License

MIT
