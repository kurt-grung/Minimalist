import { NextRequest, NextResponse } from 'next/server'
import { getTagBySlug, saveTag, deleteTag, Tag } from '@/lib/content'
import { verifyToken } from '@/lib/auth'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// GET /api/tags/[slug] - Get tag by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const { slug: slugParam } = await params
    const slug = decodeURIComponent(slugParam)
    const tag = await getTagBySlug(slug, locale)
    
    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(tag)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load tag' },
      { status: 500 }
    )
  }
}

// PUT /api/tags/[slug] - Update tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const { slug: slugParam } = await params
    const slug = decodeURIComponent(slugParam)
    const existingTag = await getTagBySlug(slug, locale)
    
    if (!existingTag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    const data = await request.json()
    const newSlug = data.slug || existingTag.slug
    
    const tag: Tag = {
      ...existingTag,
      name: data.name || existingTag.name,
      slug: newSlug,
      description: data.description !== undefined ? data.description : existingTag.description
    }

    // If slug changed, delete old and create new
    if (newSlug !== slug) {
      await deleteTag(slug, locale)
    }

    const saved = await saveTag(tag, locale)
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to update tag' },
        { status: 500 }
      )
    }

    return NextResponse.json(tag)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[slug] - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const { slug: slugParam } = await params
    const slug = decodeURIComponent(slugParam)
    
    const deleted = await deleteTag(slug, locale)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}

