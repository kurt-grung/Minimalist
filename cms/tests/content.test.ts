import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAllPosts,
  getPostBySlug,
  savePost,
  deletePost,
  getAllPages,
  getPageBySlug,
  savePage,
  deletePage,
  type Post,
  type Page,
} from '../src/lib/content'
import * as storage from '../src/lib/storage'

// Mock storage module
vi.mock('../src/lib/storage', () => ({
  storageGet: vi.fn(),
  storageSet: vi.fn(),
  storageDelete: vi.fn(),
  storageList: vi.fn(),
  storageExists: vi.fn(),
}))

const mockStorage = vi.mocked(storage)

describe('content', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Posts', () => {
    const mockPost: Post = {
      id: '1',
      title: 'Test Post',
      slug: 'test-post',
      content: 'This is a test post',
      excerpt: 'Test excerpt',
      date: '2024-01-01',
      author: 'Test Author',
    }

    describe('getAllPosts', () => {
      it('should return all posts sorted by date descending', async () => {
        const post1: Post = { ...mockPost, slug: 'post1', date: '2024-01-01', status: 'published' }
        const post2: Post = { ...mockPost, slug: 'post2', date: '2024-01-02', status: 'published' }
        const post3: Post = { ...mockPost, slug: 'post3', date: '2024-01-03', status: 'published' }

        mockStorage.storageList.mockResolvedValue(['post1.json', 'post2.json', 'post3.json'])
        // For each post, try .md first (returns null), then .json
        mockStorage.storageGet
          .mockResolvedValueOnce(null) // post1.md
          .mockResolvedValueOnce(JSON.stringify(post1)) // post1.json
          .mockResolvedValueOnce(null) // post2.md
          .mockResolvedValueOnce(JSON.stringify(post2)) // post2.json
          .mockResolvedValueOnce(null) // post3.md
          .mockResolvedValueOnce(JSON.stringify(post3)) // post3.json

        const result = await getAllPosts()

        expect(result).toHaveLength(3)
        expect(result[0].slug).toBe('post3')
        expect(result[1].slug).toBe('post2')
        expect(result[2].slug).toBe('post1')
        // All posts should have status defaulted to 'published'
        expect(result[0].status).toBe('published')
        expect(result[1].status).toBe('published')
        expect(result[2].status).toBe('published')
        expect(mockStorage.storageList).toHaveBeenCalledWith('content/posts/')
      })

      it('should filter out non-JSON and non-MD files', async () => {
        mockStorage.storageList.mockResolvedValue(['post1.json', 'post2.txt', 'post3.json', 'post4.md'])
        mockStorage.storageGet
          .mockResolvedValueOnce(null) // post1.md
          .mockResolvedValueOnce(JSON.stringify(mockPost)) // post1.json
          .mockResolvedValueOnce(null) // post3.md
          .mockResolvedValueOnce(JSON.stringify(mockPost)) // post3.json
          .mockResolvedValueOnce(`---
id: post-4
title: Markdown Post
slug: post4
date: 2024-01-01
status: published
---

Content`)

        const result = await getAllPosts()

        expect(result).toHaveLength(3)
        expect(mockStorage.storageGet).toHaveBeenCalledTimes(5) // post1.md, post1.json, post3.md, post3.json, post4.md
      })

      it('should return empty array if no posts exist', async () => {
        mockStorage.storageList.mockResolvedValue([])

        const result = await getAllPosts()

        expect(result).toEqual([])
      })

      it('should handle errors gracefully', async () => {
        mockStorage.storageList.mockRejectedValue(new Error('Storage error'))
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await getAllPosts()

        expect(result).toEqual([])
        consoleErrorSpy.mockRestore()
      })

      it('should skip posts that fail to load', async () => {
        const postWithStatus = { ...mockPost, status: 'published' as const }
        mockStorage.storageList.mockResolvedValue(['post1.json', 'post2.json', 'post3.json'])
        // For each post, try .md first (returns null), then .json
        mockStorage.storageGet
          .mockResolvedValueOnce(null) // post1.md
          .mockResolvedValueOnce(JSON.stringify(postWithStatus)) // post1.json
          .mockResolvedValueOnce(null) // post2.md
          .mockResolvedValueOnce(null) // post2.json fails to load
          .mockResolvedValueOnce(null) // post3.md
          .mockResolvedValueOnce(JSON.stringify(postWithStatus)) // post3.json

        const result = await getAllPosts()

        expect(result).toHaveLength(2) // post2 fails to load, so only post1 and post3 are returned
      })

      it('should filter out draft posts by default', async () => {
        const publishedPost: Post = { ...mockPost, slug: 'published', status: 'published' }
        const draftPost: Post = { ...mockPost, slug: 'draft', status: 'draft' }

        mockStorage.storageList.mockResolvedValue(['published.json', 'draft.json'])
        mockStorage.storageGet
          .mockResolvedValueOnce(null) // published.md
          .mockResolvedValueOnce(JSON.stringify(publishedPost)) // published.json
          .mockResolvedValueOnce(null) // draft.md
          .mockResolvedValueOnce(JSON.stringify(draftPost)) // draft.json

        const result = await getAllPosts()

        expect(result).toHaveLength(1)
        expect(result[0].slug).toBe('published')
      })

      it('should include draft posts when includeDrafts=true', async () => {
        const publishedPost: Post = { ...mockPost, slug: 'published', status: 'published' }
        const draftPost: Post = { ...mockPost, slug: 'draft', status: 'draft' }

        mockStorage.storageList.mockResolvedValue(['published.json', 'draft.json'])
        mockStorage.storageGet
          .mockResolvedValueOnce(null) // published.md
          .mockResolvedValueOnce(JSON.stringify(publishedPost)) // published.json
          .mockResolvedValueOnce(null) // draft.md
          .mockResolvedValueOnce(JSON.stringify(draftPost)) // draft.json

        const result = await getAllPosts(undefined, true)

        expect(result).toHaveLength(2)
        expect(result.map(p => p.slug)).toContain('published')
        expect(result.map(p => p.slug)).toContain('draft')
      })

      it('should filter out scheduled posts with future dates by default', async () => {
        const publishedPost: Post = { ...mockPost, slug: 'published', status: 'published', date: '2024-01-01T00:00:00.000Z' }
        const futureScheduledPost: Post = { 
          ...mockPost, 
          slug: 'scheduled', 
          status: 'scheduled', 
          scheduledDate: '2099-01-01T00:00:00.000Z',
          date: '2024-01-01T00:00:00.000Z'
        }
        const pastScheduledPost: Post = { 
          ...mockPost, 
          slug: 'past-scheduled', 
          status: 'scheduled', 
          scheduledDate: '2020-01-01T00:00:00.000Z',
          date: '2024-01-01T00:00:00.000Z'
        }

        mockStorage.storageList.mockResolvedValue(['published.json', 'scheduled.json', 'past-scheduled.json'])
        mockStorage.storageGet
          .mockResolvedValueOnce(null) // published.md
          .mockResolvedValueOnce(JSON.stringify(publishedPost)) // published.json
          .mockResolvedValueOnce(null) // scheduled.md
          .mockResolvedValueOnce(JSON.stringify(futureScheduledPost)) // scheduled.json
          .mockResolvedValueOnce(null) // past-scheduled.md
          .mockResolvedValueOnce(JSON.stringify(pastScheduledPost)) // past-scheduled.json

        const result = await getAllPosts()

        expect(result).toHaveLength(2) // published and past-scheduled (future scheduled is filtered out)
        expect(result.map(p => p.slug)).toContain('published')
        expect(result.map(p => p.slug)).toContain('past-scheduled')
        expect(result.map(p => p.slug)).not.toContain('scheduled')
      })

      it('should include all scheduled posts when includeScheduled=true', async () => {
        const futureScheduledPost: Post = { 
          ...mockPost, 
          slug: 'scheduled', 
          status: 'scheduled', 
          scheduledDate: '2099-01-01T00:00:00.000Z',
          date: '2024-01-01T00:00:00.000Z'
        }

        mockStorage.storageList.mockResolvedValue(['scheduled.json'])
        mockStorage.storageGet
          .mockResolvedValueOnce(null) // scheduled.md
          .mockResolvedValueOnce(JSON.stringify(futureScheduledPost)) // scheduled.json

        const result = await getAllPosts(undefined, false, true)

        expect(result).toHaveLength(1)
        expect(result[0].slug).toBe('scheduled')
      })
    })

    describe('getPostBySlug', () => {
      it('should return post if found (JSON)', async () => {
        // Try .md first (returns null), then .json
        mockStorage.storageGet
          .mockResolvedValueOnce(null) // test-post.md
          .mockResolvedValueOnce(JSON.stringify(mockPost)) // test-post.json

        const result = await getPostBySlug('test-post')

        expect(result).toBeTruthy()
        expect(result?.id).toBe(mockPost.id)
        expect(result?.title).toBe(mockPost.title)
        expect(result?.slug).toBe(mockPost.slug)
        expect(result?.content).toBe(mockPost.content)
        expect(result?.status).toBe('published') // Status defaults to 'published'
        expect(mockStorage.storageGet).toHaveBeenCalledWith('content/posts/test-post.md')
        expect(mockStorage.storageGet).toHaveBeenCalledWith('content/posts/test-post.json')
      })

      it('should return post if found (Markdown)', async () => {
        const markdownPost = `---
id: post-123
title: Test Post
slug: test-post
date: 2024-01-01
excerpt: Test excerpt
author: Test Author
status: published
---

This is a test post`
        
        // Try .md first, which should return the markdown content
        mockStorage.storageGet.mockResolvedValueOnce(markdownPost)

        const result = await getPostBySlug('test-post')

        expect(result).toBeTruthy()
        expect(result?.id).toBe('post-123')
        expect(result?.title).toBe('Test Post')
        expect(result?.content.trim()).toBe('This is a test post')
        expect(result?.status).toBe('published')
        expect(mockStorage.storageGet).toHaveBeenCalledWith('content/posts/test-post.md')
      })

      it('should return null if post does not exist', async () => {
        mockStorage.storageGet.mockResolvedValue(null)

        const result = await getPostBySlug('nonexistent')

        expect(result).toBeNull()
      })

      it('should handle errors gracefully', async () => {
        mockStorage.storageGet.mockRejectedValue(new Error('Storage error'))
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await getPostBySlug('test-post')

        expect(result).toBeNull()
        consoleErrorSpy.mockRestore()
      })
    })

    describe('savePost', () => {
      it('should save post successfully as JSON (default)', async () => {
        mockStorage.storageSet.mockResolvedValue(true)

        const result = await savePost(mockPost)

        expect(result).toBe(true)
        const callArgs = mockStorage.storageSet.mock.calls[0]
        expect(callArgs[0]).toBe('content/posts/test-post.json')
        const savedPost = JSON.parse(callArgs[1])
        expect(savedPost.id).toBe(mockPost.id)
        expect(savedPost.title).toBe(mockPost.title)
        expect(savedPost.slug).toBe(mockPost.slug)
        expect(savedPost.content).toBe(mockPost.content)
        expect(savedPost.updatedAt).toBeDefined() // updatedAt is automatically added
      })

      it('should save post as Markdown when useMarkdown=true', async () => {
        mockStorage.storageSet.mockResolvedValue(true)

        const result = await savePost(mockPost, undefined, true)

        expect(result).toBe(true)
        const callArgs = mockStorage.storageSet.mock.calls[0]
        expect(callArgs[0]).toBe('content/posts/test-post.md')
        expect(callArgs[1]).toContain('---')
        expect(callArgs[1]).toContain('id: 1')
        expect(callArgs[1]).toContain('title: Test Post')
        expect(callArgs[1]).toContain('slug: test-post')
        expect(callArgs[1]).toContain('date: 2024-01-01')
        expect(callArgs[1]).toContain('updatedAt') // updatedAt is automatically added
      })

      it('should return false on save error', async () => {
        mockStorage.storageSet.mockResolvedValue(false)

        const result = await savePost(mockPost)

        expect(result).toBe(false)
      })

      it('should handle errors gracefully', async () => {
        mockStorage.storageSet.mockRejectedValue(new Error('Storage error'))
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await savePost(mockPost)

        expect(result).toBe(false)
        consoleErrorSpy.mockRestore()
      })
    })

    describe('deletePost', () => {
      it('should delete post successfully', async () => {
        // Try .md first (returns false), then .json (returns true)
        mockStorage.storageDelete
          .mockResolvedValueOnce(false) // test-post.md doesn't exist
          .mockResolvedValueOnce(true) // test-post.json exists and deleted

        const result = await deletePost('test-post')

        expect(result).toBe(true)
        expect(mockStorage.storageDelete).toHaveBeenCalledWith('content/posts/test-post.md')
        expect(mockStorage.storageDelete).toHaveBeenCalledWith('content/posts/test-post.json')
      })

      it('should return false on delete error', async () => {
        mockStorage.storageDelete.mockResolvedValue(false)

        const result = await deletePost('test-post')

        expect(result).toBe(false)
      })

      it('should handle errors gracefully', async () => {
        mockStorage.storageDelete.mockRejectedValue(new Error('Storage error'))
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await deletePost('test-post')

        expect(result).toBe(false)
        consoleErrorSpy.mockRestore()
      })
    })
  })

  describe('Pages', () => {
    const mockPage: Page = {
      id: '1',
      title: 'Test Page',
      slug: 'test-page',
      content: 'This is a test page',
    }

    describe('getAllPages', () => {
      it('should return all pages', async () => {
        const page1: Page = { ...mockPage, slug: 'page1' }
        const page2: Page = { ...mockPage, slug: 'page2' }

        mockStorage.storageList.mockResolvedValue(['page1.json', 'page2.json'])
        mockStorage.storageGet
          .mockResolvedValueOnce(JSON.stringify(page1))
          .mockResolvedValueOnce(JSON.stringify(page2))

        const result = await getAllPages()

        expect(result).toHaveLength(2)
        expect(mockStorage.storageList).toHaveBeenCalledWith('content/pages/')
      })

      it('should return empty array if no pages exist', async () => {
        mockStorage.storageList.mockResolvedValue([])

        const result = await getAllPages()

        expect(result).toEqual([])
      })

      it('should handle errors gracefully', async () => {
        mockStorage.storageList.mockRejectedValue(new Error('Storage error'))
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await getAllPages()

        expect(result).toEqual([])
        consoleErrorSpy.mockRestore()
      })
    })

    describe('getPageBySlug', () => {
      it('should return page if found', async () => {
        mockStorage.storageGet.mockResolvedValue(JSON.stringify(mockPage))

        const result = await getPageBySlug('test-page')

        expect(result).toEqual(mockPage)
        expect(mockStorage.storageGet).toHaveBeenCalledWith('content/pages/test-page.json')
      })

      it('should return null if page does not exist', async () => {
        mockStorage.storageGet.mockResolvedValue(null)

        const result = await getPageBySlug('nonexistent')

        expect(result).toBeNull()
      })

      it('should handle errors gracefully', async () => {
        mockStorage.storageGet.mockRejectedValue(new Error('Storage error'))
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await getPageBySlug('test-page')

        expect(result).toBeNull()
        consoleErrorSpy.mockRestore()
      })
    })

    describe('savePage', () => {
      it('should save page successfully', async () => {
        mockStorage.storageSet.mockResolvedValue(true)

        const result = await savePage(mockPage)

        expect(result).toBe(true)
        expect(mockStorage.storageSet).toHaveBeenCalledWith(
          'content/pages/test-page.json',
          JSON.stringify(mockPage, null, 2),
        )
      })

      it('should return false on save error', async () => {
        mockStorage.storageSet.mockResolvedValue(false)

        const result = await savePage(mockPage)

        expect(result).toBe(false)
      })

      it('should handle errors gracefully', async () => {
        mockStorage.storageSet.mockRejectedValue(new Error('Storage error'))
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await savePage(mockPage)

        expect(result).toBe(false)
        consoleErrorSpy.mockRestore()
      })
    })

    describe('deletePage', () => {
      it('should delete page successfully', async () => {
        mockStorage.storageDelete.mockResolvedValue(true)

        const result = await deletePage('test-page')

        expect(result).toBe(true)
        expect(mockStorage.storageDelete).toHaveBeenCalledWith('content/pages/test-page.json')
      })

      it('should return false on delete error', async () => {
        mockStorage.storageDelete.mockResolvedValue(false)

        const result = await deletePage('test-page')

        expect(result).toBe(false)
      })

      it('should handle errors gracefully', async () => {
        mockStorage.storageDelete.mockRejectedValue(new Error('Storage error'))
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await deletePage('test-page')

        expect(result).toBe(false)
        consoleErrorSpy.mockRestore()
      })
    })
  })
})


