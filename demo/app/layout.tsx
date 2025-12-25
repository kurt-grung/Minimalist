import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Minimalist',
  description: 'Minimalist headless CMS, no backend.',
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

