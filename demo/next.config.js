const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for development (API routes need a server)
  // For production static builds, uncomment the line below:
  // output: 'export',
  images: {
    unoptimized: true,
  },
  turbopack: {
    // Set root to monorepo root where Next.js is hoisted in node_modules
    root: path.resolve(__dirname, '..'),
  },
  async rewrites() {
    return [
      // Proxy /images/* requests to /api/images/* to serve from Blob Storage in production
      // Next.js will try static files first, then fall back to this rewrite
      {
        source: '/images/:filename*',
        destination: '/api/images/:filename*',
      },
    ]
  },
}

module.exports = nextConfig

