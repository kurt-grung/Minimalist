import { NextRequest, NextResponse } from 'next/server'
import { deletePost, getPostBySlug, savePost, Post } from '@/lib/content'
import { verifyToken } from '@/lib/auth'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// DELETE /api/posts/[slug] - Delete post
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

    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const deleted = await deletePost(slug, locale || undefined)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[slug] - Update post
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

    const { slug } = await params
    const data = await request.json()
    const locale = data.locale || undefined
    
    const existingPost = await getPostBySlug(slug, locale)
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    const post: Post = {
      ...existingPost,
      title: data.title ?? existingPost.title,
      slug: data.slug ?? existingPost.slug,
      content: data.content ?? existingPost.content,
      excerpt: data.excerpt ?? existingPost.excerpt,
      author: data.author ?? existingPost.author,
      date: data.date ?? existingPost.date,
      status: data.status !== undefined ? data.status : (existingPost.status || 'published'),
      scheduledDate: data.scheduledDate !== undefined ? data.scheduledDate : existingPost.scheduledDate
    }

    const saved = await savePost(post, locale)
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

