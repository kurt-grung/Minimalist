import { NextRequest, NextResponse } from 'next/server'
import { getPostsByCategory } from '@/lib/content'

// GET /api/categories/[slug]/posts - Get posts by category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const includeDrafts = searchParams.get('includeDrafts') === 'true'
    const includeScheduled = searchParams.get('includeScheduled') === 'true'
    const preview = searchParams.get('preview') === 'true'
    
    const { slug: slugParam } = await params
    const slug = decodeURIComponent(slugParam)
    const posts = await getPostsByCategory(
      slug,
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

