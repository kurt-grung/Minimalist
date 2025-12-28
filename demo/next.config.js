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
}

module.exports = nextConfig

