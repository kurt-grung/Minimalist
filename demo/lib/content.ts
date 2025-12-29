import { storageGet, storageSet, storageDelete, storageList, storageExists } from './storage'
import { parseFrontmatter, stringifyFrontmatter, Frontmatter } from './frontmatter'

export type PostStatus = 'draft' | 'published' | 'scheduled'

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date: string
  author?: string
  status?: PostStatus
  scheduledDate?: string
  categories?: string[] // Array of category slugs
  tags?: string[] // Array of tag slugs
  updatedAt?: string // Last edited timestamp
}

export interface Page {
  id: string
  title: string
  slug: string
  content: string
}

// Get all posts
// includeDrafts: if true, includes draft posts (for admin panel)
// includeScheduled: if true, includes scheduled posts regardless of date (for admin panel)
export async function getAllPosts(locale?: string, includeDrafts: boolean = false, includeScheduled: boolean = false): Promise<Post[]> {
  try {
    const posts: Post[] = []
    const now = new Date()
    
    if (locale) {
      // Get posts for specific locale
      const keys = await storageList(`content/posts/${locale}/`)
      for (const key of keys) {
        if (key.endsWith('.json') || key.endsWith('.md')) {
          const slug = key.replace(/\.(json|md)$/, '')
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
          const slug = key.replace(/\.(json|md)$/, '')
          const post = await getPostBySlug(slug)
          if (post) {
            posts.push(post)
          }
        }
      }
    }
    
    // Fix double-encoded entities in all posts
    let filteredPosts = posts.map(post => ({
      ...post,
      content: post.content ? fixDoubleEncodedEntities(post.content) : post.content,
      excerpt: post.excerpt ? fixDoubleEncodedEntities(post.excerpt) : post.excerpt,
      // Set default status to 'published' for backward compatibility
      status: post.status || 'published'
    }))
    
    // Filter by status if not including drafts
    if (!includeDrafts) {
      filteredPosts = filteredPosts.filter(post => {
        const status = post.status || 'published'
        
        // Always include published posts
        if (status === 'published') {
          return true
        }
        
        // Include scheduled posts only if date has passed (unless includeScheduled is true)
        if (status === 'scheduled') {
          if (includeScheduled) {
            return true
          }
          const scheduledDate = post.scheduledDate || post.date
          return new Date(scheduledDate) <= now
        }
        
        // Exclude drafts
        return false
      })
    }
    
    return filteredPosts.sort((a, b) => {
      // Sort by scheduledDate if scheduled, otherwise by date
      const dateA = a.status === 'scheduled' && a.scheduledDate ? new Date(a.scheduledDate) : new Date(a.date)
      const dateB = b.status === 'scheduled' && b.scheduledDate ? new Date(b.scheduledDate) : new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })
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
    let isMarkdown = false
    
    if (locale) {
      // Try markdown first, then JSON
      content = await storageGet(`content/posts/${locale}/${slug}.md`)
      if (content) {
        isMarkdown = true
      } else {
        content = await storageGet(`content/posts/${locale}/${slug}.json`)
      }
    }
    
    // Fallback to legacy format if locale-specific not found
    if (!content) {
      content = await storageGet(`content/posts/${slug}.md`)
      if (content) {
        isMarkdown = true
      } else {
        content = await storageGet(`content/posts/${slug}.json`)
      }
    }
    
    if (!content) {
      return null
    }
    
    let post: Post
    
    if (isMarkdown) {
      // Parse markdown with frontmatter
      const { frontmatter, content: markdownContent } = parseFrontmatter(content)
      
      // Convert frontmatter to Post object
      // Parse categories and tags from frontmatter (can be comma-separated strings or arrays)
      let categories: string[] = []
      if (frontmatter.categories) {
        if (Array.isArray(frontmatter.categories)) {
          categories = frontmatter.categories
        } else if (typeof frontmatter.categories === 'string') {
          categories = frontmatter.categories.split(',').map(c => c.trim()).filter(c => c)
        }
      }
      
      let tags: string[] = []
      if (frontmatter.tags) {
        if (Array.isArray(frontmatter.tags)) {
          tags = frontmatter.tags
        } else if (typeof frontmatter.tags === 'string') {
          tags = frontmatter.tags.split(',').map(t => t.trim()).filter(t => t)
        }
      }
      
      post = {
        id: frontmatter.id || `post-${Date.now()}`,
        title: frontmatter.title || '',
        slug: frontmatter.slug || slug,
        content: markdownContent.trim(),
        excerpt: frontmatter.excerpt,
        date: frontmatter.date || new Date().toISOString(),
        author: frontmatter.author,
        status: frontmatter.status || 'published',
        scheduledDate: frontmatter.scheduledDate,
        categories,
        tags,
        updatedAt: frontmatter.updatedAt
      }
    } else {
      // Parse JSON
      post = JSON.parse(content) as Post
      // Set default status for backward compatibility
      if (!post.status) {
        post.status = 'published'
      }
    }
    
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
// Default format is JSON. Set useMarkdown=true to save as Markdown with frontmatter.
export async function savePost(post: Post, locale?: string, useMarkdown: boolean = false): Promise<boolean> {
  try {
    // Set updatedAt timestamp
    const postWithTimestamp = {
      ...post,
      updatedAt: new Date().toISOString()
    }
    
    let content: string
    let extension: string
    
    if (useMarkdown) {
      // Create frontmatter from post metadata
      const frontmatter: Frontmatter = {
        id: postWithTimestamp.id,
        title: postWithTimestamp.title,
        slug: postWithTimestamp.slug,
        date: postWithTimestamp.date,
      }
      if (postWithTimestamp.excerpt) frontmatter.excerpt = postWithTimestamp.excerpt
      if (postWithTimestamp.author) frontmatter.author = postWithTimestamp.author
      if (postWithTimestamp.status) frontmatter.status = postWithTimestamp.status
      if (postWithTimestamp.scheduledDate) frontmatter.scheduledDate = postWithTimestamp.scheduledDate
      if (postWithTimestamp.categories && postWithTimestamp.categories.length > 0) frontmatter.categories = postWithTimestamp.categories
      if (postWithTimestamp.tags && postWithTimestamp.tags.length > 0) frontmatter.tags = postWithTimestamp.tags
      if (postWithTimestamp.updatedAt) frontmatter.updatedAt = postWithTimestamp.updatedAt
      
      // Stringify with frontmatter
      content = stringifyFrontmatter(frontmatter, postWithTimestamp.content)
      extension = '.md'
    } else {
      // Use JSON format
      content = JSON.stringify(postWithTimestamp, null, 2)
      extension = '.json'
    }
    
    if (locale) {
      return await storageSet(`content/posts/${locale}/${postWithTimestamp.slug}${extension}`, content)
    } else {
      // Legacy format
      return await storageSet(`content/posts/${postWithTimestamp.slug}${extension}`, content)
    }
  } catch (error) {
    console.error('Error saving post:', error)
    return false
  }
}

// Delete post
export async function deletePost(slug: string, locale?: string): Promise<boolean> {
  try {
    let deleted = false
    
    if (locale) {
      // Try both markdown and JSON
      deleted = await storageDelete(`content/posts/${locale}/${slug}.md`) || 
                await storageDelete(`content/posts/${locale}/${slug}.json`)
    } else {
      // Try legacy format (both markdown and JSON)
      deleted = await storageDelete(`content/posts/${slug}.md`) || 
                await storageDelete(`content/posts/${slug}.json`)
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

// Category and Tag Management

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string // For hierarchical categories
  locale?: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  locale?: string
}

// Category functions
export async function getAllCategories(locale?: string): Promise<Category[]> {
  try {
    const categories: Category[] = []
    const path = locale ? `content/categories/${locale}/` : 'content/categories/'
    const keys = await storageList(path)
    
    for (const key of keys) {
      if (key.endsWith('.json')) {
        const slug = key.replace('.json', '').replace(path, '')
        const category = await getCategoryBySlug(slug, locale)
        if (category) {
          categories.push(category)
        }
      }
    }
    
    return categories
  } catch (error) {
    console.error('Error getting all categories:', error)
    return []
  }
}

export async function getCategoryBySlug(slug: string, locale?: string): Promise<Category | null> {
  try {
    const path = locale ? `content/categories/${locale}/${slug}.json` : `content/categories/${slug}.json`
    const content = await storageGet(path)
    if (!content) return null
    return JSON.parse(content) as Category
  } catch (error) {
    console.error('Error getting category:', error)
    return null
  }
}

export async function saveCategory(category: Category, locale?: string): Promise<boolean> {
  try {
    const content = JSON.stringify(category, null, 2)
    const path = locale ? `content/categories/${locale}/${category.slug}.json` : `content/categories/${category.slug}.json`
    return await storageSet(path, content)
  } catch (error) {
    console.error('Error saving category:', error)
    return false
  }
}

export async function deleteCategory(slug: string, locale?: string): Promise<boolean> {
  try {
    const path = locale ? `content/categories/${locale}/${slug}.json` : `content/categories/${slug}.json`
    return await storageDelete(path)
  } catch (error) {
    console.error('Error deleting category:', error)
    return false
  }
}

// Tag functions
export async function getAllTags(locale?: string): Promise<Tag[]> {
  try {
    const tags: Tag[] = []
    const path = locale ? `content/tags/${locale}/` : 'content/tags/'
    const keys = await storageList(path)
    
    for (const key of keys) {
      if (key.endsWith('.json')) {
        const slug = key.replace('.json', '').replace(path, '')
        const tag = await getTagBySlug(slug, locale)
        if (tag) {
          tags.push(tag)
        }
      }
    }
    
    return tags
  } catch (error) {
    console.error('Error getting all tags:', error)
    return []
  }
}

export async function getTagBySlug(slug: string, locale?: string): Promise<Tag | null> {
  try {
    const path = locale ? `content/tags/${locale}/${slug}.json` : `content/tags/${slug}.json`
    const content = await storageGet(path)
    if (!content) return null
    return JSON.parse(content) as Tag
  } catch (error) {
    console.error('Error getting tag:', error)
    return null
  }
}

export async function saveTag(tag: Tag, locale?: string): Promise<boolean> {
  try {
    const content = JSON.stringify(tag, null, 2)
    const path = locale ? `content/tags/${locale}/${tag.slug}.json` : `content/tags/${tag.slug}.json`
    return await storageSet(path, content)
  } catch (error) {
    console.error('Error saving tag:', error)
    return false
  }
}

export async function deleteTag(slug: string, locale?: string): Promise<boolean> {
  try {
    const path = locale ? `content/tags/${locale}/${slug}.json` : `content/tags/${slug}.json`
    return await storageDelete(path)
  } catch (error) {
    console.error('Error deleting tag:', error)
    return false
  }
}

// Get posts by category
export async function getPostsByCategory(categorySlug: string, locale?: string, includeDrafts: boolean = false, includeScheduled: boolean = false): Promise<Post[]> {
  const allPosts = await getAllPosts(locale, includeDrafts, includeScheduled)
  return allPosts.filter(post => post.categories?.includes(categorySlug))
}

// Get posts by tag
export async function getPostsByTag(tagSlug: string, locale?: string, includeDrafts: boolean = false, includeScheduled: boolean = false): Promise<Post[]> {
  const allPosts = await getAllPosts(locale, includeDrafts, includeScheduled)
  return allPosts.filter(post => post.tags?.includes(tagSlug))
}

// Get category/tag counts
export async function getCategoryCounts(locale?: string): Promise<Record<string, number>> {
  const posts = await getAllPosts(locale, false, false)
  const counts: Record<string, number> = {}
  
  posts.forEach(post => {
    post.categories?.forEach(categorySlug => {
      counts[categorySlug] = (counts[categorySlug] || 0) + 1
    })
  })
  
  return counts
}

export async function getTagCounts(locale?: string): Promise<Record<string, number>> {
  const posts = await getAllPosts(locale, false, false)
  const counts: Record<string, number> = {}
  
  posts.forEach(post => {
    post.tags?.forEach(tagSlug => {
      counts[tagSlug] = (counts[tagSlug] || 0) + 1
    })
  })
  
  return counts
}
