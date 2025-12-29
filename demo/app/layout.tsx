import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Minimalist',
  description: 'Minimalist CMS, no backend.',
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

