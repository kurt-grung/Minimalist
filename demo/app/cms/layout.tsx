// Force dynamic rendering for all CMS pages
// CMS pages use browser-only APIs (localStorage, window, useSearchParams)
// and cannot be statically generated
export const dynamic = 'force-dynamic'

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

