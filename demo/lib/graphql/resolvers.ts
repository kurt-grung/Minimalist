import {
  getAllPosts,
  getPostBySlug,
  getAllPages,
  getPageBySlug,
  getAllCategories,
  getAllTags,
  type Post as DemoPost,
  type Page as DemoPage,
} from '@/lib/content'
import { getConfig } from '@/lib/config'

type GQLContext = {
  user: { username: string } | null
  req: Request
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function searchInText(text: string, query: string): number {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (!t || !q) return 0
  let score = 0
  if (t.includes(q)) score += 30
  const words = q.split(/\s+/)
  for (const w of words) {
    const occurrences = t.split(w).length - 1
    score += occurrences * 5
  }
  return score
}

function calculateRelevance(item: DemoPost | DemoPage, query: string, type: 'post' | 'page'): number {
  const queryLower = query.toLowerCase()
  let score = 0
  if (item.title?.toLowerCase().includes(queryLower)) score += 50
  if (item.title?.toLowerCase() === queryLower) score += 100
  const titleWords = (item.title || '').toLowerCase().split(/\s+/)
  const queryWords = queryLower.split(/\s+/)
  for (const qWord of queryWords) {
    if (titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
      score += 20
    }
  }
  if ((item as DemoPost).excerpt && type === 'post') {
    const excerptText = stripHtml((item as DemoPost).excerpt || '')
    score += searchInText(excerptText, query) * 0.5
  }
  const contentText = stripHtml(item.content || '')
  score += searchInText(contentText, query) * 0.3
  if (item.slug?.toLowerCase().includes(queryLower)) score += 15
  if (type === 'post') {
    const p = item as DemoPost
    if (p.date) {
      const postDate = new Date(p.date)
      const daysSince = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 30) score += 5
    }
  }
  return score
}

export const resolvers = {
  Query: {
    posts: async (_: unknown, args: { locale?: string; limit?: number; offset?: number; status?: string }, _ctx: GQLContext) => {
      const { locale, limit, offset, status } = args
      try {
        const all = await getAllPosts(locale, false, false)
        let filtered = all
        if (status) {
          filtered = all.filter(p => (p.status || 'published') === status)
        }
        const start = offset ?? 0
        const end = limit ? start + limit : undefined
        return filtered.slice(start, end).map(p => ({ ...p, locale }))
      } catch (error) {
        console.error('Error in posts resolver:', error)
        return []
      }
    },
    post: async (_: unknown, args: { slug: string; locale?: string; preview?: boolean }, ctx: GQLContext) => {
      const { slug, locale, preview } = args
      const post = await getPostBySlug(slug, locale)
      if (!post) return null
      const status = post.status || 'published'
      if (preview) {
        if (!ctx.user) return null
        return { ...post, locale }
      }
      if (status === 'draft') return null
      if (status === 'scheduled') {
        const scheduledDate = post.scheduledDate || post.date
        if (scheduledDate && new Date(scheduledDate) > new Date()) return null
      }
      return { ...post, locale }
    },
    pages: async (_: unknown, args: { locale?: string }) => {
      const pages = await getAllPages(args.locale)
      return pages.map(p => ({ ...p, locale: args.locale }))
    },
    page: async (_: unknown, args: { slug: string; locale?: string }) => {
      const page = await getPageBySlug(args.slug, args.locale)
      return page ? { ...page, locale: args.locale } : null
    },
    categories: async (_: unknown, args: { locale?: string }) => {
      return await getAllCategories(args.locale)
    },
    tags: async (_: unknown, args: { locale?: string }) => {
      return await getAllTags(args.locale)
    },
    search: async (_: unknown, args: { query: string; locale?: string; type?: string }) => {
      const { query, locale, type } = args
      const includePosts = !type || type === 'all' || type === 'post'
      const includePages = !type || type === 'all' || type === 'page'
      const results: any[] = []
      if (includePosts) {
        const posts = await getAllPosts(locale, false, false)
        for (const p of posts) {
          const relevance = calculateRelevance(p, query, 'post')
          if (relevance > 0) {
            results.push({
              id: p.id,
              type: 'post',
              title: p.title,
              slug: p.slug,
              excerpt: p.excerpt || '',
              relevance,
              locale,
            })
          }
        }
      }
      if (includePages) {
        const pages = await getAllPages(locale)
        for (const pg of pages) {
          const relevance = calculateRelevance(pg as DemoPage, query, 'page')
          if (relevance > 0) {
            results.push({
              id: pg.id,
              type: 'page',
              title: pg.title,
              slug: pg.slug,
              excerpt: '',
              relevance,
              locale,
            })
          }
        }
      }
      results.sort((a, b) => b.relevance - a.relevance)
      return { total: results.length, results }
    },
    settings: () => {
      const cfg = getConfig()
      return {
        siteTitle: cfg.siteTitle,
        siteSubtitle: cfg.siteSubtitle,
        defaultLocale: cfg.defaultLocale,
        postRoute: cfg.postRoute,
        pageRoute: cfg.pageRoute,
      }
    },
  },
}


