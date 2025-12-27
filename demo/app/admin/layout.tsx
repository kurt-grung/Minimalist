// Force dynamic rendering for all admin pages
// Admin pages use browser-only APIs (localStorage, window, useSearchParams)
// and cannot be statically generated
export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

