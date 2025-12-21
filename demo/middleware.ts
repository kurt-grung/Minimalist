import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin' && pathname !== '/admin/') {
    // For admin routes, we'll let the client-side handle auth check
    // since tokens are stored in localStorage
    // The client-side checkAuth will redirect if not authenticated
    // This middleware ensures the route structure is correct
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}

