import { describe, it, expect, beforeEach, vi } from 'vitest'

// Use vi.hoisted() to create mocks that can be referenced in vi.mock()
const { mockExistsSync, mockReadFileSync, mockWriteFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
}))

vi.mock('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
}))

// Now import after mocks are set up
import {
  ensureConfig,
  getConfig,
  updateConfig,
  type SiteConfig,
} from '../src/lib/config'

describe('config', () => {
  const defaultConfig: SiteConfig = {
    siteTitle: 'My Blog',
    siteSubtitle: 'Welcome to our simple file-based CMS',
    postRoute: 'posts',
    pageRoute: '',
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', enabled: true }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all mocks
    mockExistsSync.mockReturnValue(false)
    mockReadFileSync.mockReturnValue(JSON.stringify(defaultConfig))
    mockWriteFileSync.mockImplementation(() => {})
  })

  describe('ensureConfig', () => {
    it('should create config file if it does not exist', () => {
      mockExistsSync.mockReturnValue(false)
      mockWriteFileSync.mockImplementation(() => {})

      ensureConfig()

      expect(mockExistsSync).toHaveBeenCalled()
      expect(mockWriteFileSync).toHaveBeenCalled()
      const writeCall = mockWriteFileSync.mock.calls[0]
      expect(JSON.parse(writeCall[1] as string)).toEqual(defaultConfig)
      expect(writeCall[2]).toBe('utf-8')
    })

    it('should not create config file if it already exists', () => {
      mockExistsSync.mockReturnValue(true)

      ensureConfig()

      expect(mockWriteFileSync).not.toHaveBeenCalled()
    })
  })

  describe('getConfig', () => {
    it('should return default config if file does not exist', () => {
      mockExistsSync.mockReturnValue(false)
      mockWriteFileSync.mockImplementation(() => {})

      const result = getConfig()

      expect(result).toEqual(defaultConfig)
    })

    it('should return parsed config from file', () => {
      const customConfig: SiteConfig = {
        siteTitle: 'Custom Blog',
        siteSubtitle: 'Custom subtitle',
        postRoute: 'articles',
        pageRoute: 'pages',
        defaultLocale: 'en',
        locales: [
          { code: 'en', name: 'English', enabled: true }
        ]
      }
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(customConfig))

      const result = getConfig()

      expect(result).toEqual(customConfig)
      expect(mockReadFileSync).toHaveBeenCalled()
      const readCall = mockReadFileSync.mock.calls[0]
      expect(readCall[1]).toBe('utf-8')
    })

    it('should return default config if file read fails', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = getConfig()

      expect(result).toEqual(defaultConfig)
    })

    it('should return default config if JSON is invalid', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('invalid json')

      const result = getConfig()

      expect(result).toEqual(defaultConfig)
    })
  })

  describe('updateConfig', () => {
    it('should merge partial config with existing config', () => {
      const existingConfig: SiteConfig = {
        siteTitle: 'Existing Blog',
        siteSubtitle: 'Existing subtitle',
        postRoute: 'posts',
        pageRoute: '',
        defaultLocale: 'en',
        locales: [
          { code: 'en', name: 'English', enabled: true }
        ]
      }
      const update: Partial<SiteConfig> = {
        siteTitle: 'Updated Blog',
        postRoute: 'articles',
      }
      const expectedConfig: SiteConfig = {
        siteTitle: 'Updated Blog',
        siteSubtitle: 'Existing subtitle',
        postRoute: 'articles',
        pageRoute: '',
        defaultLocale: 'en',
        locales: [
          { code: 'en', name: 'English', enabled: true }
        ]
      }

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(existingConfig))
      mockWriteFileSync.mockImplementation(() => {})

      const result = updateConfig(update)

      expect(result.siteTitle).toBe('Updated Blog')
      expect(result.postRoute).toBe('articles')
      expect(result.siteSubtitle).toBe('Existing subtitle')
      expect(mockWriteFileSync).toHaveBeenCalled()
      const writeCall = mockWriteFileSync.mock.calls[0]
      expect(JSON.parse(writeCall[1] as string)).toEqual(result)
      expect(writeCall[2]).toBe('utf-8')
    })

    it('should create config file if it does not exist before updating', () => {
      const update: Partial<SiteConfig> = {
        siteTitle: 'New Blog',
      }

      // updateConfig calls ensureConfig() then getConfig()
      // getConfig() also calls ensureConfig()
      // So: ensureConfig (in updateConfig) -> ensureConfig (in getConfig) -> write (in updateConfig)
      mockExistsSync
        .mockReturnValueOnce(false) // updateConfig -> ensureConfig check
        .mockReturnValueOnce(false) // getConfig -> ensureConfig check  
        .mockReturnValueOnce(true) // getConfig -> readFile check
        .mockReturnValueOnce(true) // updateConfig -> final write check
      mockWriteFileSync.mockImplementation(() => {})
      mockReadFileSync.mockReturnValue(JSON.stringify(defaultConfig))

      const result = updateConfig(update)

      // ensureConfig writes twice (once from updateConfig, once from getConfig), updateConfig writes once
      expect(mockWriteFileSync).toHaveBeenCalledTimes(3)
      expect(result.siteTitle).toBe('New Blog')
    })

    it('should update only specified fields', () => {
      const existingConfig: SiteConfig = {
        siteTitle: 'My Blog',
        siteSubtitle: 'My subtitle',
        postRoute: 'posts',
        pageRoute: '',
        defaultLocale: 'en',
        locales: [
          { code: 'en', name: 'English', enabled: true }
        ]
      }
      const update: Partial<SiteConfig> = {
        siteSubtitle: 'Updated subtitle',
      }

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(existingConfig))
      mockWriteFileSync.mockImplementation(() => {})

      const result = updateConfig(update)

      expect(result.siteTitle).toBe('My Blog')
      expect(result.siteSubtitle).toBe('Updated subtitle')
      expect(result.postRoute).toBe('posts')
      expect(result.pageRoute).toBe('')
    })
  })
})


