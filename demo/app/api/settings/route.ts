import { NextRequest, NextResponse } from 'next/server'
import { getConfig, updateConfig } from '@/lib/config'
import { verifyToken } from '@/lib/auth'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// GET /api/settings - Get site configuration
export async function GET() {
  try {
    const config = getConfig()
    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update site configuration
export async function PUT(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const config = updateConfig({
      siteTitle: data.siteTitle,
      siteSubtitle: data.siteSubtitle,
      postRoute: data.postRoute,
      pageRoute: data.pageRoute,
      defaultLocale: data.defaultLocale,
      locales: data.locales
    })

    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

