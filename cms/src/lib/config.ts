import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'config.json')

export interface SiteConfig {
  siteTitle: string  // e.g., "My Blog", "My Website"
  siteSubtitle: string  // e.g., "Welcome to our simple file-based CMS"
  postRoute: string  // e.g., "posts", "blog", "articles"
  pageRoute: string  // e.g., "", "pages", "content"
}

const DEFAULT_CONFIG: SiteConfig = {
  siteTitle: 'My Blog',
  siteSubtitle: 'Welcome to our simple file-based CMS',
  postRoute: 'posts',
  pageRoute: ''
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
    return JSON.parse(content) as SiteConfig
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
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8')
  return newConfig
}

