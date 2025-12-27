import { Post } from './content'

/**
 * Parse frontmatter from a markdown file
 * Supports YAML-style frontmatter between --- delimiters
 */
export function parseFrontmatter(markdown: string): { frontmatter: Record<string, any>, content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = markdown.match(frontmatterRegex)
  
  if (!match) {
    // No frontmatter found, return empty frontmatter and full content
    return { frontmatter: {}, content: markdown }
  }
  
  const frontmatterText = match[1]
  const content = match[2]
  
  // Parse YAML-like frontmatter (simple key: value pairs)
  const frontmatter: Record<string, any> = {}
  const lines = frontmatterText.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = trimmed.substring(0, colonIndex).trim()
    let value = trimmed.substring(colonIndex + 1).trim()
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    // Try to parse as boolean
    if (value === 'true') {
      frontmatter[key] = true
    } else if (value === 'false') {
      frontmatter[key] = false
    } else {
      frontmatter[key] = value
    }
  }
  
  return { frontmatter, content }
}

/**
 * Generate frontmatter string from a Post object
 */
export function generateFrontmatter(post: Post): string {
  const frontmatter: Record<string, string> = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    date: post.date,
  }
  
  if (post.excerpt) {
    frontmatter.excerpt = post.excerpt
  }
  
  if (post.author) {
    frontmatter.author = post.author
  }
  
  // Convert to YAML-like format
  const lines = Object.entries(frontmatter).map(([key, value]) => {
    // Escape special characters in value
    const escapedValue = String(value).replace(/"/g, '\\"')
    return `${key}: "${escapedValue}"`
  })
  
  return `---\n${lines.join('\n')}\n---\n\n`
}

/**
 * Convert a Post object to markdown format with frontmatter
 */
export function postToMarkdown(post: Post, markdownContent: string): string {
  const frontmatter = generateFrontmatter(post)
  return frontmatter + markdownContent
}

/**
 * Convert markdown with frontmatter to a Post object
 */
export function markdownToPost(markdown: string): Post | null {
  try {
    const { frontmatter, content } = parseFrontmatter(markdown)
    
    // Validate required fields
    if (!frontmatter.id || !frontmatter.title || !frontmatter.slug || !frontmatter.date) {
      return null
    }
    
    const post: Post = {
      id: String(frontmatter.id),
      title: String(frontmatter.title),
      slug: String(frontmatter.slug),
      date: String(frontmatter.date),
      content: content.trim(),
    }
    
    if (frontmatter.excerpt) {
      post.excerpt = String(frontmatter.excerpt)
    }
    
    if (frontmatter.author) {
      post.author = String(frontmatter.author)
    }
    
    return post
  } catch (error) {
    console.error('Error parsing markdown to post:', error)
    return null
  }
}
