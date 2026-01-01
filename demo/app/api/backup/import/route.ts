import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { savePost, savePage } from '@/lib/content'
import { getConfig } from '@/lib/config'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// POST /api/backup/import - Import content from JSON backup
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

    // Check if user has admin role
    const { hasPermission: checkPermission, getUserRole } = await import('@/lib/auth')
    const userRole = getUserRole(payload.username)
    if (!checkPermission(userRole, 'admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid backup format' },
        { status: 400 }
      )
    }

    const { posts = {}, pages = {}, config: backupConfig } = body
    const imported: { posts: number; pages: number; errors: string[] } = {
      posts: 0,
      pages: 0,
      errors: []
    }

    // Import posts
    for (const [locale, localePosts] of Object.entries(posts)) {
      if (!Array.isArray(localePosts)) {
        imported.errors.push(`Invalid posts format for locale ${locale}`)
        continue
      }

      for (const post of localePosts) {
        try {
          if (!post.slug || !post.title) {
            imported.errors.push(`Skipping post with missing slug or title in locale ${locale}`)
            continue
          }

          await savePost(
            {
              id: post.id || `${locale}-${post.slug}`,
              title: post.title,
              slug: post.slug,
              content: post.content || '',
              excerpt: post.excerpt,
              date: post.date || new Date().toISOString(),
              author: post.author,
              status: post.status || 'published',
              scheduledDate: post.scheduledDate,
              categories: post.categories || [],
              tags: post.tags || [],
              updatedAt: post.updatedAt
            },
            locale
          )
          imported.posts++
        } catch (error) {
          imported.errors.push(`Error importing post ${post.slug} in locale ${locale}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // Import pages
    for (const [locale, localePages] of Object.entries(pages)) {
      if (!Array.isArray(localePages)) {
        imported.errors.push(`Invalid pages format for locale ${locale}`)
        continue
      }

      for (const page of localePages) {
        try {
          if (!page.slug || !page.title) {
            imported.errors.push(`Skipping page with missing slug or title in locale ${locale}`)
            continue
          }

          await savePage(
            {
              id: page.id || `${locale}-${page.slug}`,
              title: page.title,
              slug: page.slug,
              content: page.content || ''
            },
            locale
          )
          imported.pages++
        } catch (error) {
          imported.errors.push(`Error importing page ${page.slug} in locale ${locale}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      message: `Imported ${imported.posts} posts and ${imported.pages} pages. ${imported.errors.length} errors.`
    })
  } catch (error) {
    console.error('Error importing backup:', error)
    return NextResponse.json(
      { error: 'Failed to import backup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

