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
        const post1: Post = { ...mockPost, slug: 'post1', date: '2024-01-01' }
        const post2: Post = { ...mockPost, slug: 'post2', date: '2024-01-02' }
        const post3: Post = { ...mockPost, slug: 'post3', date: '2024-01-03' }

        mockStorage.storageList.mockResolvedValue(['post1.json', 'post2.json', 'post3.json'])
        mockStorage.storageGet
          .mockResolvedValueOnce(JSON.stringify(post1))
          .mockResolvedValueOnce(JSON.stringify(post2))
          .mockResolvedValueOnce(JSON.stringify(post3))

        const result = await getAllPosts()

        expect(result).toHaveLength(3)
        expect(result[0].slug).toBe('post3')
        expect(result[1].slug).toBe('post2')
        expect(result[2].slug).toBe('post1')
        expect(mockStorage.storageList).toHaveBeenCalledWith('content/posts/')
      })

      it('should filter out non-JSON files', async () => {
        mockStorage.storageList.mockResolvedValue(['post1.json', 'post2.txt', 'post3.json'])
        mockStorage.storageGet
          .mockResolvedValueOnce(JSON.stringify(mockPost))
          .mockResolvedValueOnce(JSON.stringify(mockPost))

        const result = await getAllPosts()

        expect(result).toHaveLength(2)
        expect(mockStorage.storageGet).toHaveBeenCalledTimes(2)
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
        mockStorage.storageList.mockResolvedValue(['post1.json', 'post2.json', 'post3.json'])
        mockStorage.storageGet
          .mockResolvedValueOnce(JSON.stringify(mockPost))
          .mockResolvedValueOnce(null) // post2 fails to load
          .mockResolvedValueOnce(JSON.stringify(mockPost))

        const result = await getAllPosts()

        expect(result).toHaveLength(2)
      })
    })

    describe('getPostBySlug', () => {
      it('should return post if found', async () => {
        mockStorage.storageGet.mockResolvedValue(JSON.stringify(mockPost))

        const result = await getPostBySlug('test-post')

        expect(result).toEqual(mockPost)
        expect(mockStorage.storageGet).toHaveBeenCalledWith('content/posts/test-post.json')
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
      it('should save post successfully', async () => {
        mockStorage.storageSet.mockResolvedValue(true)

        const result = await savePost(mockPost)

        expect(result).toBe(true)
        expect(mockStorage.storageSet).toHaveBeenCalledWith(
          'content/posts/test-post.json',
          JSON.stringify(mockPost, null, 2),
        )
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
        mockStorage.storageDelete.mockResolvedValue(true)

        const result = await deletePost('test-post')

        expect(result).toBe(true)
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


