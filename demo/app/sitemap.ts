import { MetadataRoute } from 'next'
import { getAllPosts, getAllPages } from '@/lib/content'
import { getConfig } from '@/lib/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const config = getConfig()
  const enabledLocales = config.locales?.filter(l => l.enabled) || []
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const pageRoute = config.pageRoute !== undefined && config.pageRoute !== null ? config.pageRoute : ''

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  // Add locale-specific homepage URLs
  for (const locale of enabledLocales) {
    if (locale.code !== config.defaultLocale) {
      routes.push({
        url: `${baseUrl}/${locale.code}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      })
    }
  }

  // Add posts for all enabled locales
  for (const locale of enabledLocales) {
    const posts = await getAllPosts(locale.code)
    posts.forEach((post) => {
      // Generate URL with locale prefix
      let postUrl: string
      if (postRoute) {
        postUrl = `${baseUrl}/${locale.code}/${postRoute}/${post.slug}`
      } else {
        postUrl = `${baseUrl}/${locale.code}/${post.slug}`
      }
      routes.push({
        url: postUrl,
        lastModified: new Date(post.date),
        changeFrequency: 'weekly',
        priority: 0.8,
      })

      // Also add without locale prefix for default locale (backward compatibility)
      if (locale.code === config.defaultLocale) {
        if (postRoute) {
          postUrl = `${baseUrl}/${postRoute}/${post.slug}`
        } else {
          postUrl = `${baseUrl}/${post.slug}`
        }
        routes.push({
          url: postUrl,
          lastModified: new Date(post.date),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    })
  }

  // Add pages for all enabled locales
  for (const locale of enabledLocales) {
    const pages = await getAllPages(locale.code)
    pages.forEach((page) => {
      // Generate URL with locale prefix
      let pageUrl: string
      if (pageRoute) {
        pageUrl = `${baseUrl}/${locale.code}/${pageRoute}/${page.slug}`
      } else {
        pageUrl = `${baseUrl}/${locale.code}/${page.slug}`
      }
      routes.push({
        url: pageUrl,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })

      // Also add without locale prefix for default locale (backward compatibility)
      if (locale.code === config.defaultLocale) {
        if (pageRoute) {
          pageUrl = `${baseUrl}/${pageRoute}/${page.slug}`
        } else {
          pageUrl = `${baseUrl}/${page.slug}`
        }
        routes.push({
          url: pageUrl,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    })
  }

  return routes
}

