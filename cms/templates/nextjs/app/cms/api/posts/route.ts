import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts, savePost, Post, verifyToken } from 'minimalist'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// GET /cms/api/posts - Get all posts
export async function GET() {
  try {
    const posts = await getAllPosts()
    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load posts' },
      { status: 500 }
    )
  }
}

// POST /cms/api/posts - Create new post
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
    
    // Generate ID if not provided
    const id = data.id || `post-${Date.now()}`
    
    const post: Post = {
      id,
      title: data.title,
      slug: data.slug || data.title.toLowerCase().replace(/\s+/g, '-'),
      content: data.content,
      excerpt: data.excerpt || '',
      date: data.date || new Date().toISOString(),
      author: data.author || ''
    }

    const saved = await savePost(post)
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

