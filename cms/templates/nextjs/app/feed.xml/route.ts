import { NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/content'
import { getConfig } from '@/lib/config'

// Strip HTML tags for RSS description
function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Format date for RSS (RFC 822)
function formatRssDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toUTCString()
}

// Generate RSS feed XML
function generateRssFeed(
  posts: Array<{
    title: string
    slug: string
    content: string
    excerpt?: string
    date: string
    author?: string
    updatedAt?: string
  }>,
  config: ReturnType<typeof getConfig>
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const siteTitle = config.siteTitle || 'My Blog'
  const siteSubtitle = config.siteSubtitle || 'Welcome to our simple file-based CMS'
  const feedUrl = `${baseUrl}/feed.xml`
  const siteUrl = baseUrl
  
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteSubtitle)}</description>
    <language>en</language>
    <lastBuildDate>${formatRssDate(new Date())}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <generator>Minimalist CMS</generator>
`

  posts.forEach((post) => {
    const postUrl = postRoute 
      ? `${baseUrl}/${postRoute}/${post.slug}`
      : `${baseUrl}/${post.slug}`
    
    const pubDate = formatRssDate(post.date)
    const lastBuildDate = post.updatedAt ? formatRssDate(post.updatedAt) : pubDate
    
    // Use excerpt if available, otherwise strip HTML from content
    const description = post.excerpt 
      ? stripHtml(post.excerpt)
      : stripHtml(post.content).substring(0, 300) + '...'
    
    // Full content for content:encoded
    const content = post.content || ''
    
    rss += `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
`
    
    if (post.author) {
      rss += `      <author>${escapeXml(post.author)}</author>\n`
    }
    
    rss += `    </item>
`
  })

  rss += `  </channel>
</rss>`

  return rss
}

// Main RSS feed
export async function GET() {
  try {
    const config = getConfig()
    const posts = await getAllPosts()
    
    // Limit to latest 20 posts
    const limitedPosts = posts.slice(0, 20)
    
    const rssXml = generateRssFeed(limitedPosts, config)
    
    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new NextResponse('Error generating RSS feed', { status: 500 })
  }
}

