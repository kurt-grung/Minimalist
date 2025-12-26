import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import {
  ensureConfig,
  getConfig,
  updateConfig,
  type SiteConfig,
} from '../config'

// Mock fs module
vi.mock('fs')

const mockFs = vi.mocked(fs)

describe('config', () => {
  const defaultConfig: SiteConfig = {
    siteTitle: 'My Blog',
    siteSubtitle: 'Welcome to our simple file-based CMS',
    postRoute: 'posts',
    pageRoute: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Note: CONFIG_FILE is evaluated at module load time
    // The tests work by mocking fs operations directly
  })

  describe('ensureConfig', () => {
    it('should create config file if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)
      mockFs.writeFileSync.mockImplementation(() => {})

      ensureConfig()

      expect(mockFs.existsSync).toHaveBeenCalled()
      expect(mockFs.writeFileSync).toHaveBeenCalled()
      const writeCall = mockFs.writeFileSync.mock.calls[0]
      expect(JSON.parse(writeCall[1] as string)).toEqual(defaultConfig)
      expect(writeCall[2]).toBe('utf-8')
    })

    it('should not create config file if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true)

      ensureConfig()

      expect(mockFs.writeFileSync).not.toHaveBeenCalled()
    })
  })

  describe('getConfig', () => {
    it('should return default config if file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)
      mockFs.writeFileSync.mockImplementation(() => {})

      const result = getConfig()

      expect(result).toEqual(defaultConfig)
    })

    it('should return parsed config from file', () => {
      const customConfig: SiteConfig = {
        siteTitle: 'Custom Blog',
        siteSubtitle: 'Custom subtitle',
        postRoute: 'articles',
        pageRoute: 'pages',
      }
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig))

      const result = getConfig()

      expect(result).toEqual(customConfig)
      expect(mockFs.readFileSync).toHaveBeenCalled()
      const readCall = mockFs.readFileSync.mock.calls[0]
      expect(readCall[1]).toBe('utf-8')
    })

    it('should return default config if file read fails', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = getConfig()

      expect(result).toEqual(defaultConfig)
    })

    it('should return default config if JSON is invalid', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue('invalid json')

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
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingConfig))
      mockFs.writeFileSync.mockImplementation(() => {})

      const result = updateConfig(update)

      expect(result.siteTitle).toBe('Updated Blog')
      expect(result.postRoute).toBe('articles')
      expect(result.siteSubtitle).toBe('Existing subtitle')
      expect(mockFs.writeFileSync).toHaveBeenCalled()
      const writeCall = mockFs.writeFileSync.mock.calls[0]
      expect(JSON.parse(writeCall[1] as string)).toEqual(result)
      expect(writeCall[2]).toBe('utf-8')
    })

    it('should create config file if it does not exist before updating', () => {
      const update: Partial<SiteConfig> = {
        siteTitle: 'New Blog',
      }

      mockFs.existsSync
        .mockReturnValueOnce(false) // First check in updateConfig
        .mockReturnValueOnce(false) // Check in ensureConfig
        .mockReturnValueOnce(true) // After ensure, file exists
      mockFs.writeFileSync.mockImplementation(() => {})
      mockFs.readFileSync.mockReturnValue(JSON.stringify(defaultConfig))

      const result = updateConfig(update)

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2) // Once in ensureConfig, once in updateConfig
      expect(result.siteTitle).toBe('New Blog')
    })

    it('should update only specified fields', () => {
      const existingConfig: SiteConfig = {
        siteTitle: 'My Blog',
        siteSubtitle: 'My subtitle',
        postRoute: 'posts',
        pageRoute: '',
      }
      const update: Partial<SiteConfig> = {
        siteSubtitle: 'Updated subtitle',
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingConfig))
      mockFs.writeFileSync.mockImplementation(() => {})

      const result = updateConfig(update)

      expect(result.siteTitle).toBe('My Blog')
      expect(result.siteSubtitle).toBe('Updated subtitle')
      expect(result.postRoute).toBe('posts')
      expect(result.pageRoute).toBe('')
    })
  })
})

