import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts, getAllPages, type Post, type Page } from '@/lib/content'
import { getConfig } from '@/lib/config'

export interface SearchResult {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date?: string
  author?: string
  type: 'post' | 'page'
  locale?: string
  relevance: number
}

// Simple text search function
function searchInText(text: string, query: string): number {
  if (!text || !query) return 0
  
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0)
  
  if (queryWords.length === 0) return 0
  
  let score = 0
  let matches = 0
  
  // Exact phrase match (highest score)
  if (lowerText.includes(lowerQuery)) {
    score += 100
    matches++
  }
  
  // Individual word matches
  for (const word of queryWords) {
    if (word.length < 2) continue // Skip very short words
    
    // Count occurrences
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const occurrences = (lowerText.match(regex) || []).length
    
    if (occurrences > 0) {
      score += occurrences * 10
      matches++
    }
  }
  
  // Title matches get bonus
  return score + (matches * 5)
}

// Strip HTML tags for searching
function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Calculate relevance score
function calculateRelevance(item: Post | Page, query: string, type: 'post' | 'page'): number {
  const queryLower = query.toLowerCase()
  let score = 0
  
  // Title match (highest weight)
  if (item.title.toLowerCase().includes(queryLower)) {
    score += 50
  }
  
  // Exact title match (even higher)
  if (item.title.toLowerCase() === queryLower) {
    score += 100
  }
  
  // Title word matches
  const titleWords = item.title.toLowerCase().split(/\s+/)
  const queryWords = queryLower.split(/\s+/)
  for (const qWord of queryWords) {
    if (titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
      score += 20
    }
  }
  
  // Excerpt match (only Posts have excerpts)
  if (type === 'post') {
    const post = item as Post
    if (post.excerpt) {
      const excerptText = stripHtml(post.excerpt)
      score += searchInText(excerptText, query) * 0.5
    }
  }
  
  // Content match
  const contentText = stripHtml(item.content || '')
  score += searchInText(contentText, query) * 0.3
  
  // Slug match
  if (item.slug.toLowerCase().includes(queryLower)) {
    score += 15
  }
  
  // Date relevance (newer posts get slight boost)
  if (type === 'post') {
    const post = item as Post
    if (post.date) {
      const postDate = new Date(post.date)
      const daysSince = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 30) {
        score += 5 // Boost for recent posts
      }
    }
  }
  
  return score
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const locale = searchParams.get('locale') || undefined
    const type = searchParams.get('type') as 'post' | 'page' | 'all' | null
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [], query: query.trim() })
    }
    
    const config = getConfig()
    const results: SearchResult[] = []
    
    // Search posts
    if (!type || type === 'all' || type === 'post') {
      const posts = locale 
        ? await getAllPosts(locale)
        : await Promise.all(
            (config.locales || [])
              .filter(l => l.enabled)
              .map(l => getAllPosts(l.code))
          ).then(arrays => arrays.flat())
      
      for (const post of posts) {
        const relevance = calculateRelevance(post, query, 'post')
        if (relevance > 0) {
          results.push({
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt,
            date: post.date,
            author: post.author,
            type: 'post',
            locale: locale,
            relevance
          })
        }
      }
    }
    
    // Search pages
    if (!type || type === 'all' || type === 'page') {
      const pages = locale
        ? await getAllPages(locale)
        : await Promise.all(
            (config.locales || [])
              .filter(l => l.enabled)
              .map(l => getAllPages(l.code))
          ).then(arrays => arrays.flat())
      
      for (const page of pages) {
        const relevance = calculateRelevance(page, query, 'page')
        if (relevance > 0) {
          results.push({
            id: page.id,
            title: page.title,
            slug: page.slug,
            content: page.content,
            excerpt: undefined,
            date: undefined,
            author: undefined,
            type: 'page',
            locale: locale,
            relevance
          })
        }
      }
    }
    
    // Sort by relevance (highest first)
    results.sort((a, b) => b.relevance - a.relevance)
    
    // Limit results
    const limitedResults = results.slice(0, 50)
    
    return NextResponse.json({
      results: limitedResults,
      query: query.trim(),
      total: results.length
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed', results: [], query: '' },
      { status: 500 }
    )
  }
}

