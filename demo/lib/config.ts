import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'config.json')

export interface Locale {
  code: string  // e.g., "en", "es", "fr"
  name: string  // e.g., "English", "Spanish", "French"
  enabled: boolean  // Whether this locale is active
}

export interface SiteConfig {
  siteTitle: string  // e.g., "My Blog", "My Website"
  siteSubtitle: string  // e.g., "Welcome to our simple file-based CMS"
  postRoute: string  // e.g., "posts", "blog", "articles"
  pageRoute: string  // e.g., "", "pages", "content"
  defaultLocale: string  // Default locale code, e.g., "en"
  locales: Locale[]  // Available locales
}

const DEFAULT_CONFIG: SiteConfig = {
  siteTitle: 'My Blog',
  siteSubtitle: 'Welcome to our simple file-based CMS',
  postRoute: 'posts',
  pageRoute: '',
  defaultLocale: 'en',
  locales: [
    { code: 'en', name: 'English', enabled: true }
  ]
}

// Ensure config file exists
export function ensureConfig(): void {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8')
  }
}

// Get site configuration
export function getConfig(): SiteConfig {
  ensureConfig()
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8')
    const config = JSON.parse(content) as Partial<SiteConfig>
    // Migrate old configs that don't have locales
    if (!config.locales || config.locales.length === 0) {
      config.defaultLocale = config.defaultLocale || 'en'
      config.locales = [{ code: 'en', name: 'English', enabled: true }]
    }
    if (!config.defaultLocale) {
      config.defaultLocale = config.locales[0]?.code || 'en'
    }
    return config as SiteConfig
  } catch (error) {
    return DEFAULT_CONFIG
  }
}

// Update site configuration
export function updateConfig(config: Partial<SiteConfig>): SiteConfig {
  ensureConfig()
  const currentConfig = getConfig()
  const newConfig: SiteConfig = {
    ...currentConfig,
    ...config
  }
  // Ensure locales array exists and defaultLocale is set
  if (!newConfig.locales || newConfig.locales.length === 0) {
    newConfig.locales = [{ code: 'en', name: 'English', enabled: true }]
  }
  if (!newConfig.defaultLocale) {
    newConfig.defaultLocale = newConfig.locales[0]?.code || 'en'
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8')
  return newConfig
}

// Get enabled locales
export function getEnabledLocales(): Locale[] {
  const config = getConfig()
  return config.locales.filter(locale => locale.enabled)
}

// Get locale by code
export function getLocaleByCode(code: string): Locale | undefined {
  const config = getConfig()
  return config.locales.find(locale => locale.code === code)
}

