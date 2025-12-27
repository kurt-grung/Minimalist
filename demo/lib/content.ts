import { storageGet, storageSet, storageDelete, storageList, storageExists } from './storage'

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date: string
  author?: string
}

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
    
    if (locale) {
      // Get posts for specific locale
      const keys = await storageList(`content/posts/${locale}/`)
      for (const key of keys) {
        if (key.endsWith('.json')) {
          const slug = key.replace('.json', '')
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
        if (key.endsWith('.json') && !key.includes('/')) {
          // Legacy format: content/posts/slug.json
          const slug = key.replace('.json', '')
          const post = await getPostBySlug(slug)
          if (post) {
            posts.push(post)
          }
        }
      }
    }
    
    // Fix double-encoded entities in all posts
    return posts.map(post => ({
      ...post,
      content: post.content ? fixDoubleEncodedEntities(post.content) : post.content,
      excerpt: post.excerpt ? fixDoubleEncodedEntities(post.excerpt) : post.excerpt
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error getting all posts:', error)
    return []
  }
}

// Fix double-encoded HTML entities in content
function fixDoubleEncodedEntities(html: string): string {
  if (!html) return html
  // Fix double-encoded entities (must be done in order - &amp; first)
  return html
    .replace(/&amp;amp;/g, '&amp;')
    .replace(/&amp;nbsp;/g, '&nbsp;')
    .replace(/&amp;lt;/g, '&lt;')
    .replace(/&amp;gt;/g, '&gt;')
    .replace(/&amp;quot;/g, '&quot;')
    .replace(/&amp;#39;/g, '&#39;')
    .replace(/&amp;#x27;/g, '&#x27;')
    .replace(/&amp;#x2F;/g, '&#x2F;')
}

// Get post by slug
export async function getPostBySlug(slug: string, locale?: string): Promise<Post | null> {
  try {
    let content: string | null = null
    
    if (locale) {
      // Try locale-specific path first
      content = await storageGet(`content/posts/${locale}/${slug}.json`)
    }
    
    // Fallback to legacy format if locale-specific not found
    if (!content) {
      content = await storageGet(`content/posts/${slug}.json`)
    }
    
    if (!content) {
      return null
    }
    const post = JSON.parse(content) as Post
    // Fix any double-encoded entities in the post content
    if (post.content) {
      post.content = fixDoubleEncodedEntities(post.content)
    }
    if (post.excerpt) {
      post.excerpt = fixDoubleEncodedEntities(post.excerpt)
    }
    return post
  } catch (error) {
    console.error('Error getting post:', error)
    return null
  }
}

// Save post
export async function savePost(post: Post, locale?: string): Promise<boolean> {
  try {
    const content = JSON.stringify(post, null, 2)
    if (locale) {
      return await storageSet(`content/posts/${locale}/${post.slug}.json`, content)
    } else {
      // Legacy format
      return await storageSet(`content/posts/${post.slug}.json`, content)
    }
  } catch (error) {
    console.error('Error saving post:', error)
    return false
  }
}

// Delete post
export async function deletePost(slug: string, locale?: string): Promise<boolean> {
  try {
    if (locale) {
      return await storageDelete(`content/posts/${locale}/${slug}.json`)
    } else {
      // Try legacy format
      return await storageDelete(`content/posts/${slug}.json`)
    }
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
    const page = JSON.parse(content) as Page
    // Fix any double-encoded entities in the page content
    if (page.content) {
      page.content = fixDoubleEncodedEntities(page.content)
    }
    return page
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
