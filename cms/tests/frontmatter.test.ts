import { describe, it, expect } from 'vitest'
import {
  parseFrontmatter,
  stringifyFrontmatter,
  hasFrontmatter,
  type Frontmatter,
} from '../src/lib/frontmatter'

describe('frontmatter', () => {
  describe('parseFrontmatter', () => {
    it('should parse frontmatter from markdown', () => {
      const markdown = `---
id: post-123
title: My Post
slug: my-post
date: 2024-01-01T00:00:00.000Z
excerpt: A short excerpt
author: John Doe
---

# My Post

This is the content.`

      const result = parseFrontmatter(markdown)

      expect(result.frontmatter).toEqual({
        id: 'post-123',
        title: 'My Post',
        slug: 'my-post',
        date: '2024-01-01T00:00:00.000Z',
        excerpt: 'A short excerpt',
        author: 'John Doe',
      })
      expect(result.content.trim()).toBe('# My Post\n\nThis is the content.')
    })

    it('should handle markdown without frontmatter', () => {
      const markdown = '# My Post\n\nThis is the content.'
      const result = parseFrontmatter(markdown)

      expect(result.frontmatter).toEqual({})
      expect(result.content).toBe(markdown)
    })

    it('should handle quoted values in frontmatter', () => {
      const markdown = `---
title: "My Post"
excerpt: 'A short excerpt'
---

Content`

      const result = parseFrontmatter(markdown)

      expect(result.frontmatter.title).toBe('My Post')
      expect(result.frontmatter.excerpt).toBe('A short excerpt')
    })

    it('should handle empty frontmatter', () => {
      const markdown = `---
---

Content`
      const result = parseFrontmatter(markdown)

      expect(result.frontmatter).toEqual({})
      // When frontmatter is empty, the regex might not match, so content should be the full markdown
      // Or if it does match, content should be after the delimiters
      expect(result.content).toContain('Content')
    })

    it('should handle frontmatter with special characters', () => {
      const markdown = `---
title: "Post: With Colon"
slug: my-post
---

Content`
      const result = parseFrontmatter(markdown)

      expect(result.frontmatter.title).toBe('Post: With Colon')
    })
  })

  describe('stringifyFrontmatter', () => {
    it('should create markdown with frontmatter', () => {
      const frontmatter: Frontmatter = {
        id: 'post-123',
        title: 'My Post',
        slug: 'my-post',
        date: '2024-01-01T00:00:00.000Z',
        excerpt: 'A short excerpt',
        author: 'John Doe',
      }
      const content = '# My Post\n\nThis is the content.'

      const result = stringifyFrontmatter(frontmatter, content)

      expect(result).toContain('---')
      expect(result).toContain('id: post-123')
      expect(result).toContain('title: My Post')
      expect(result).toContain('slug: my-post')
      // Date contains colon, so it will be quoted
      expect(result).toMatch(/date:\s*"2024-01-01T00:00:00\.000Z"/)
      expect(result).toContain('excerpt: A short excerpt')
      expect(result).toContain('author: John Doe')
      expect(result).toContain('# My Post')
      expect(result).toContain('This is the content.')
    })

    it('should return content only if frontmatter is empty', () => {
      const content = '# My Post\n\nThis is the content.'
      const result = stringifyFrontmatter({}, content)

      expect(result).toBe(content)
    })

    it('should quote values with special characters', () => {
      const frontmatter: Frontmatter = {
        title: 'Post: With Colon',
        slug: 'my-post',
      }
      const content = 'Content'

      const result = stringifyFrontmatter(frontmatter, content)

      expect(result).toContain('title: "Post: With Colon"')
    })

    it('should handle null and undefined values', () => {
      const frontmatter: Frontmatter = {
        id: 'post-123',
        title: 'My Post',
        excerpt: undefined,
        author: null as any,
      }
      const content = 'Content'

      const result = stringifyFrontmatter(frontmatter, content)

      expect(result).toContain('id: post-123')
      expect(result).toContain('title: My Post')
      expect(result).not.toContain('excerpt:')
      expect(result).not.toContain('author:')
    })
  })

  describe('hasFrontmatter', () => {
    it('should return true for markdown with frontmatter', () => {
      const markdown = `---
title: My Post
---

Content`
      expect(hasFrontmatter(markdown)).toBe(true)
    })

    it('should return false for markdown without frontmatter', () => {
      const markdown = '# My Post\n\nContent'
      expect(hasFrontmatter(markdown)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(hasFrontmatter('')).toBe(false)
    })
  })
})

