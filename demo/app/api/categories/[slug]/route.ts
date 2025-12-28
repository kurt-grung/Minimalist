import { NextRequest, NextResponse } from 'next/server'
import { getCategoryBySlug, saveCategory, deleteCategory, Category } from '@/lib/content'
import { verifyToken } from '@/lib/auth'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// GET /api/categories/[slug] - Get category by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const { slug: slugParam } = await params
    const slug = decodeURIComponent(slugParam)
    const category = await getCategoryBySlug(slug, locale)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[slug] - Update category
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
    const existingCategory = await getCategoryBySlug(slug, locale)
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const data = await request.json()
    const newSlug = data.slug || existingCategory.slug
    
    const category: Category = {
      ...existingCategory,
      name: data.name || existingCategory.name,
      slug: newSlug,
      description: data.description !== undefined ? data.description : existingCategory.description,
      parentId: data.parentId !== undefined ? data.parentId : existingCategory.parentId
    }

    // If slug changed, delete old and create new
    if (newSlug !== slug) {
      await deleteCategory(slug, locale)
    }

    const saved = await saveCategory(category, locale)
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[slug] - Delete category
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
    
    const deleted = await deleteCategory(slug, locale)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}

