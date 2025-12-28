import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts, savePost, Post } from '@/lib/content'
import { verifyToken } from '@/lib/auth'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// GET /api/posts - Get all posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const includeDrafts = searchParams.get('includeDrafts') === 'true'
    const includeScheduled = searchParams.get('includeScheduled') === 'true'
    const preview = searchParams.get('preview') === 'true'
    
    // If preview mode, include drafts and scheduled posts
    const posts = await getAllPosts(
      locale || undefined,
      includeDrafts || preview,
      includeScheduled || preview
    )
    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create new post
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
    
    // Generate ID if not provided
    const id = data.id || `post-${Date.now()}`
    
    const post: Post = {
      id,
      title: data.title,
      slug: data.slug || data.title.toLowerCase().replace(/\s+/g, '-'),
      content: data.content,
      excerpt: data.excerpt || '',
      date: data.date || new Date().toISOString(),
      author: data.author || '',
      status: data.status || 'published',
      scheduledDate: data.scheduledDate || undefined,
      categories: data.categories || [],
      tags: data.tags || []
    }

    const saved = await savePost(post, locale)
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save post' },
        { status: 500 }
      )
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

