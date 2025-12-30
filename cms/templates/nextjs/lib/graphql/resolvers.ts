import {
  getAllPosts,
  getPostBySlug,
  getAllPages,
  getPageBySlug,
} from '@/lib/content'
import { getConfig } from '@/lib/config'
import { storageGet, storageList } from '@/lib/storage'

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

export const resolvers = {
  Query: {
    posts: async (_: unknown, args: { locale?: string; limit?: number; offset?: number }) => {
      const { locale, limit, offset } = args
      const all = await getAllPosts(locale)
      const start = offset ?? 0
      const end = limit ? start + limit : undefined
      return all.slice(start, end).map(p => ({ ...p, locale }))
    },
    post: async (_: unknown, args: { slug: string; locale?: string; preview?: boolean }, ctx: GQLContext) => {
      const { slug, locale, preview } = args
      if (preview && !ctx.user) return null
      const post = await getPostBySlug(slug, locale)
      return post ? { ...post, locale } : null
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
      // Optional in template; load if content files exist
      const prefix = args.locale ? `content/categories/${args.locale}/` : 'content/categories/'
      const keys = await storageList(prefix)
      const results: Array<{ id: string; name: string; slug: string }> = []
      for (const key of keys) {
        if (key.endsWith('.json')) {
          const slug = key.replace('.json', '').replace(prefix, '')
          const content = await storageGet(`${prefix}${slug}.json`)
          if (content) {
            try {
              const parsed = JSON.parse(content) as { id: string; name: string; slug: string }
              results.push({ id: parsed.id, name: parsed.name, slug: parsed.slug })
            } catch {
              // ignore malformed
            }
          }
        }
      }
      return results
    },
    tags: async (_: unknown, args: { locale?: string }) => {
      const prefix = args.locale ? `content/tags/${args.locale}/` : 'content/tags/'
      const keys = await storageList(prefix)
      const results: Array<{ id: string; name: string; slug: string }> = []
      for (const key of keys) {
        if (key.endsWith('.json')) {
          const slug = key.replace('.json', '').replace(prefix, '')
          const content = await storageGet(`${prefix}${slug}.json`)
          if (content) {
            try {
              const parsed = JSON.parse(content) as { id: string; name: string; slug: string }
              results.push({ id: parsed.id, name: parsed.name, slug: parsed.slug })
            } catch {
              // ignore malformed
            }
          }
        }
      }
      return results
    },
    search: async (_: unknown, args: { query: string; locale?: string; type?: string }) => {
      const { query, locale, type } = args
      const includePosts = !type || type === 'all' || type === 'post'
      const includePages = !type || type === 'all' || type === 'page'
      const results: any[] = []
      if (includePosts) {
        const posts = await getAllPosts(locale)
        for (const p of posts) {
          const contentText = stripHtml(p.content || '')
          const titleScore = searchInText(p.title || '', query)
          const contentScore = searchInText(contentText, query) * 0.3
          const relevance = titleScore * 2 + contentScore
          if (relevance > 0) {
            results.push({
              id: p.id,
              type: 'post',
              title: p.title,
              slug: p.slug,
              excerpt: '',
              relevance,
              locale,
            })
          }
        }
      }
      if (includePages) {
        const pages = await getAllPages(locale)
        for (const pg of pages) {
          const contentText = stripHtml(pg.content || '')
          const titleScore = searchInText(pg.title || '', query)
          const contentScore = searchInText(contentText, query) * 0.3
          const relevance = titleScore * 2 + contentScore
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


