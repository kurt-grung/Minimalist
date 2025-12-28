import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getConfig,
  updateConfig,
  getEnabledLocales,
  getLocaleByCode,
  ensureConfig,
  type SiteConfig,
} from '../lib/config'

// Mock fs module
vi.mock('fs', () => {
  const mockExistsSync = vi.fn()
  const mockReadFileSync = vi.fn()
  const mockWriteFileSync = vi.fn()
  
  return {
    default: {
      existsSync: mockExistsSync,
      readFileSync: mockReadFileSync,
      writeFileSync: mockWriteFileSync,
    },
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
  }
})

// Get the mocked functions
import fs from 'fs'
const mockExistsSync = vi.mocked(fs.existsSync)
const mockReadFileSync = vi.mocked(fs.readFileSync)
const mockWriteFileSync = vi.mocked(fs.writeFileSync)

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
    mockExistsSync.mockReset()
    mockReadFileSync.mockReset()
    mockWriteFileSync.mockReset()
  })

  describe('ensureConfig', () => {
    it('should create config file if it does not exist', () => {
      mockExistsSync.mockReturnValue(false)

      ensureConfig()

      expect(mockWriteFileSync).toHaveBeenCalled()
    })

    it('should not create file if it already exists', () => {
      mockExistsSync.mockReturnValue(true)

      ensureConfig()

      expect(mockWriteFileSync).not.toHaveBeenCalled()
    })
  })

  describe('getConfig', () => {
    it('should return default config if file does not exist', () => {
      mockExistsSync.mockReturnValue(false)

      const config = getConfig()

      expect(config.siteTitle).toBe(defaultConfig.siteTitle)
      expect(config.defaultLocale).toBe('en')
    })

    it('should return parsed config from file', () => {
      const customConfig: SiteConfig = {
        ...defaultConfig,
        siteTitle: 'Custom Blog',
        postRoute: 'articles',
      }

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(customConfig))

      const config = getConfig()

      expect(config.siteTitle).toBe('Custom Blog')
      expect(config.postRoute).toBe('articles')
    })

    it('should migrate old configs without locales', () => {
      const oldConfig = {
        siteTitle: 'My Blog',
        postRoute: 'posts',
        // No locales field
      }

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(oldConfig))

      const config = getConfig()

      expect(config.locales).toBeDefined()
      expect(config.locales.length).toBeGreaterThan(0)
      expect(config.defaultLocale).toBe('en')
    })

    it('should return default config on parse error', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('invalid json')

      const config = getConfig()

      expect(config.siteTitle).toBe(defaultConfig.siteTitle)
    })
  })

  describe('updateConfig', () => {
    it('should update config and merge with existing', () => {
      const existingConfig: SiteConfig = {
        ...defaultConfig,
        siteTitle: 'Old Title',
      }

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(existingConfig))

      const updated = updateConfig({ siteTitle: 'New Title' })

      expect(updated.siteTitle).toBe('New Title')
      expect(mockWriteFileSync).toHaveBeenCalled()
    })

    it('should ensure locales array exists', () => {
      const configWithoutLocales = {
        siteTitle: 'Test',
        postRoute: 'posts',
      }

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(configWithoutLocales))

      const updated = updateConfig({ siteTitle: 'New Title' })

      expect(updated.locales).toBeDefined()
      expect(updated.locales.length).toBeGreaterThan(0)
    })
  })

  describe('getEnabledLocales', () => {
    it('should return only enabled locales', () => {
      const config: SiteConfig = {
        ...defaultConfig,
        locales: [
          { code: 'en', name: 'English', enabled: true },
          { code: 'es', name: 'Spanish', enabled: false },
          { code: 'fr', name: 'French', enabled: true },
        ],
      }

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(config))

      const enabled = getEnabledLocales()

      expect(enabled).toHaveLength(2)
      expect(enabled.map(l => l.code)).toEqual(['en', 'fr'])
    })
  })

  describe('getLocaleByCode', () => {
    it('should return locale by code', () => {
      const config: SiteConfig = {
        ...defaultConfig,
        locales: [
          { code: 'en', name: 'English', enabled: true },
          { code: 'es', name: 'Spanish', enabled: true },
        ],
      }

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(config))

      const locale = getLocaleByCode('es')

      expect(locale).toBeTruthy()
      expect(locale?.name).toBe('Spanish')
    })

    it('should return undefined if locale not found', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(defaultConfig))

      const locale = getLocaleByCode('nonexistent')

      expect(locale).toBeUndefined()
    })
  })
})

