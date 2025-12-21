/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for development (API routes need a server)
  // For production static builds, uncomment the line below:
  // output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

