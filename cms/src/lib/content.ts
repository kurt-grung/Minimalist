import { storageGet, storageSet, storageDelete, storageList, storageExists } from './storage'
import { markdownToPost, postToMarkdown, parseFrontmatter } from './frontmatter'

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date: string
  author?: string
}

export type PostFormat = 'json' | 'markdown'

export interface Page {
  id: string
  title: string
  slug: string
  content: string
}

// Get all posts
export async function getAllPosts(locale?: string): Promise<Post[]> {
  try {
    const posts: Post[] = []
    const seenSlugs = new Set<string>()
    
    if (locale) {
      // Get posts for specific locale
      const keys = await storageList(`content/posts/${locale}/`)
      for (const key of keys) {
        if (key.endsWith('.json') || key.endsWith('.md')) {
          const slug = key.replace(/\.(json|md)$/, '')
          // Avoid duplicates (prefer JSON over markdown if both exist)
          if (seenSlugs.has(slug)) continue
          seenSlugs.add(slug)
          
          const post = await getPostBySlug(slug, locale)
          if (post) {
            posts.push(post)
          }
        }
      }
    } else {
      // Get all posts from all locales (legacy support)
      const keys = await storageList('content/posts/')
      for (const key of keys) {
        if ((key.endsWith('.json') || key.endsWith('.md')) && !key.includes('/')) {
          // Legacy format: content/posts/slug.json or slug.md
          // Process JSON files first, then markdown (prefer JSON)
          const slug = key.replace(/\.(json|md)$/, '')
          if (seenSlugs.has(slug)) continue
          seenSlugs.add(slug)
          
          const post = await getPostBySlug(slug)
          if (post) {
            posts.push(post)
          }
        }
      }
    }
    
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error getting all posts:', error)
    return []
  }
}

// Get post by slug
export async function getPostBySlug(slug: string, locale?: string): Promise<Post | null> {
  try {
    let content: string | null = null
    let isMarkdown = false
    
    if (locale) {
      // Try JSON first (default format), then markdown
      content = await storageGet(`content/posts/${locale}/${slug}.json`)
      if (!content) {
        content = await storageGet(`content/posts/${locale}/${slug}.md`)
        if (content) {
          isMarkdown = true
        }
      }
    }
    
    // Fallback to legacy format if locale-specific not found
    if (!content) {
      content = await storageGet(`content/posts/${slug}.json`)
      if (!content) {
        content = await storageGet(`content/posts/${slug}.md`)
        if (content) {
          isMarkdown = true
        }
      }
    }
    
    if (!content) {
      return null
    }
    
    // Parse based on format
    if (isMarkdown) {
      const post = markdownToPost(content)
      return post
    } else {
      return JSON.parse(content) as Post
    }
  } catch (error) {
    console.error('Error getting post:', error)
    return null
  }
}

// Save post (as JSON by default for backward compatibility)
export async function savePost(post: Post, locale?: string, format: PostFormat = 'json'): Promise<boolean> {
  try {
    let content: string
    let extension: string
    
    if (format === 'markdown') {
      // Convert HTML content to markdown (basic conversion - assumes content is HTML)
      // For now, we'll save the HTML content as-is in the markdown body
      // The frontmatter will contain the metadata
      content = postToMarkdown(post, post.content)
      extension = '.md'
    } else {
      content = JSON.stringify(post, null, 2)
      extension = '.json'
    }
    
    if (locale) {
      return await storageSet(`content/posts/${locale}/${post.slug}${extension}`, content)
    } else {
      // Legacy format
      return await storageSet(`content/posts/${post.slug}${extension}`, content)
    }
  } catch (error) {
    console.error('Error saving post:', error)
    return false
  }
}

// Save post as markdown (convenience function)
export async function savePostAsMarkdown(post: Post, locale?: string, markdownContent?: string): Promise<boolean> {
  try {
    // Use provided markdown content or convert HTML to markdown
    const mdContent = markdownContent || post.content
    const content = postToMarkdown(post, mdContent)
    
    if (locale) {
      return await storageSet(`content/posts/${locale}/${post.slug}.md`, content)
    } else {
      return await storageSet(`content/posts/${post.slug}.md`, content)
    }
  } catch (error) {
    console.error('Error saving post as markdown:', error)
    return false
  }
}

// Delete post (tries both JSON and Markdown formats)
export async function deletePost(slug: string, locale?: string): Promise<boolean> {
  try {
    let deleted = false
    
    if (locale) {
      // Try both formats (order doesn't matter for deletion)
      deleted = await storageDelete(`content/posts/${locale}/${slug}.json`) || 
                await storageDelete(`content/posts/${locale}/${slug}.md`)
    } else {
      // Try legacy format (both formats)
      deleted = await storageDelete(`content/posts/${slug}.json`) || 
                await storageDelete(`content/posts/${slug}.md`)
    }
    
    return deleted
  } catch (error) {
    console.error('Error deleting post:', error)
    return false
  }
}

// Get all pages
export async function getAllPages(locale?: string): Promise<Page[]> {
  try {
    const pages: Page[] = []
    
    if (locale) {
      // Get pages for specific locale
      const keys = await storageList(`content/pages/${locale}/`)
      for (const key of keys) {
        if (key.endsWith('.json')) {
          const slug = key.replace('.json', '')
          const page = await getPageBySlug(slug, locale)
          if (page) {
            pages.push(page)
          }
        }
      }
    } else {
      // Get all pages from all locales (legacy support)
      const keys = await storageList('content/pages/')
      for (const key of keys) {
        if (key.endsWith('.json') && !key.includes('/')) {
          // Legacy format: content/pages/slug.json
          const slug = key.replace('.json', '')
          const page = await getPageBySlug(slug)
          if (page) {
            pages.push(page)
          }
        }
      }
    }
    
    return pages
  } catch (error) {
    console.error('Error getting all pages:', error)
    return []
  }
}

// Get page by slug
export async function getPageBySlug(slug: string, locale?: string): Promise<Page | null> {
  try {
    let content: string | null = null
    
    if (locale) {
      // Try locale-specific path first
      content = await storageGet(`content/pages/${locale}/${slug}.json`)
    }
    
    // Fallback to legacy format if locale-specific not found
    if (!content) {
      content = await storageGet(`content/pages/${slug}.json`)
    }
    
    if (!content) {
      return null
    }
    return JSON.parse(content) as Page
  } catch (error) {
    console.error('Error getting page:', error)
    return null
  }
}

// Save page
export async function savePage(page: Page, locale?: string): Promise<boolean> {
  try {
    const content = JSON.stringify(page, null, 2)
    if (locale) {
      return await storageSet(`content/pages/${locale}/${page.slug}.json`, content)
    } else {
      // Legacy format
      return await storageSet(`content/pages/${page.slug}.json`, content)
    }
  } catch (error) {
    console.error('Error saving page:', error)
    return false
  }
}

// Delete page
export async function deletePage(slug: string, locale?: string): Promise<boolean> {
  try {
    if (locale) {
      return await storageDelete(`content/pages/${locale}/${slug}.json`)
    } else {
      // Try legacy format
      return await storageDelete(`content/pages/${slug}.json`)
    }
  } catch (error) {
    console.error('Error deleting page:', error)
    return false
  }
}

