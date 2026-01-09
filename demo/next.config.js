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
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self';",
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
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

