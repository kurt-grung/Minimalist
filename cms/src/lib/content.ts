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
export async function getAllPosts(): Promise<Post[]> {
  try {
    const keys = await storageList('content/posts/')
    const posts: Post[] = []
    
    for (const key of keys) {
      if (key.endsWith('.json')) {
        const slug = key.replace('.json', '')
        const post = await getPostBySlug(slug)
        if (post) {
          posts.push(post)
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
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const content = await storageGet(`content/posts/${slug}.json`)
    if (!content) {
      return null
    }
    return JSON.parse(content) as Post
  } catch (error) {
    console.error('Error getting post:', error)
    return null
  }
}

// Save post
export async function savePost(post: Post): Promise<boolean> {
  try {
    const content = JSON.stringify(post, null, 2)
    return await storageSet(`content/posts/${post.slug}.json`, content)
  } catch (error) {
    console.error('Error saving post:', error)
    return false
  }
}

// Delete post
export async function deletePost(slug: string): Promise<boolean> {
  try {
    return await storageDelete(`content/posts/${slug}.json`)
  } catch (error) {
    console.error('Error deleting post:', error)
    return false
  }
}

// Get all pages
export async function getAllPages(): Promise<Page[]> {
  try {
    const keys = await storageList('content/pages/')
    const pages: Page[] = []
    
    for (const key of keys) {
      if (key.endsWith('.json')) {
        const slug = key.replace('.json', '')
        const page = await getPageBySlug(slug)
        if (page) {
          pages.push(page)
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
export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const content = await storageGet(`content/pages/${slug}.json`)
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
export async function savePage(page: Page): Promise<boolean> {
  try {
    const content = JSON.stringify(page, null, 2)
    return await storageSet(`content/pages/${page.slug}.json`, content)
  } catch (error) {
    console.error('Error saving page:', error)
    return false
  }
}

// Delete page
export async function deletePage(slug: string): Promise<boolean> {
  try {
    return await storageDelete(`content/pages/${slug}.json`)
  } catch (error) {
    console.error('Error deleting page:', error)
    return false
  }
}

