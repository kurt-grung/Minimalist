import { MetadataRoute } from 'next'
import { getAllPosts, getAllPages } from '@/lib/content'
import { getConfig } from '@/lib/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const config = getConfig()

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  const posts = await getAllPosts()
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  posts.forEach((post) => {
    const postUrl = postRoute ? `${baseUrl}/${postRoute}/${post.slug}` : `${baseUrl}/${post.slug}`
    routes.push({
      url: postUrl,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  })

  const pages = await getAllPages()
  const pageRoute = config.pageRoute !== undefined && config.pageRoute !== null ? config.pageRoute : ''
  pages.forEach((page) => {
    const pageUrl = pageRoute ? `${baseUrl}/${pageRoute}/${page.slug}` : `${baseUrl}/${page.slug}`
    routes.push({
      url: pageUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  })

  return routes
}

