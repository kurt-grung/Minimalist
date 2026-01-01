import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getAllPosts, getAllPages } from '@/lib/content'
import { getConfig } from '@/lib/config'
import fs from 'fs'
import path from 'path'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// GET /api/backup/export - Export all content as JSON
export async function GET(request: NextRequest) {
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

    const config = getConfig()
    const locales = config.locales || [config.defaultLocale || 'en']
    
    const backup: {
      version: string
      exportedAt: string
      config: ReturnType<typeof getConfig>
      posts: Record<string, any[]>
      pages: Record<string, any[]>
    } = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      config,
      posts: {},
      pages: {}
    }

    // Export posts for each locale
    for (const locale of locales) {
      try {
        const posts = await getAllPosts(locale.code, true, true) // Include drafts and scheduled
        backup.posts[locale.code] = posts.map(post => ({
          ...post,
          // Ensure all fields are included
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          date: post.date,
          author: post.author,
          status: post.status,
          scheduledDate: post.scheduledDate,
          categories: post.categories,
          tags: post.tags,
          updatedAt: post.updatedAt,
          // Include any additional fields that may exist
          ...(post as any).image && { image: (post as any).image },
          ...(post as any).locale && { locale: (post as any).locale }
        }))
      } catch (error) {
        console.error(`Error exporting posts for locale ${locale.code}:`, error)
        backup.posts[locale.code] = []
      }
    }

    // Export pages for each locale
    for (const locale of locales) {
      try {
        const pages = await getAllPages(locale.code)
        backup.pages[locale.code] = pages.map(page => ({
          ...page,
          id: page.id,
          title: page.title,
          slug: page.slug,
          content: page.content,
          // Include locale if it exists
          ...(page as any).locale && { locale: (page as any).locale }
        }))
      } catch (error) {
        console.error(`Error exporting pages for locale ${locale.code}:`, error)
        backup.pages[locale.code] = []
      }
    }

    return NextResponse.json(backup, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="cms-backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Error exporting backup:', error)
    return NextResponse.json(
      { error: 'Failed to export backup' },
      { status: 500 }
    )
  }
}

