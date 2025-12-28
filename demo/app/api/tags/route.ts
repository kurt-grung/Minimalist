import { NextRequest, NextResponse } from 'next/server'
import { getAllTags, saveTag, Tag } from '@/lib/content'
import { verifyToken } from '@/lib/auth'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// GET /api/tags - Get all tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const tags = await getAllTags(locale)
    return NextResponse.json(tags)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load tags' },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create new tag
export async function POST(request: NextRequest) {
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
    const locale = data.locale || undefined
    
    // Generate ID and slug if not provided
    const id = data.id || `tag-${Date.now()}`
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
    const tag: Tag = {
      id,
      name: data.name,
      slug,
      description: data.description || '',
      locale
    }

    const saved = await saveTag(tag, locale)
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save tag' },
        { status: 500 }
      )
    }

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}

