/**
 * Storage adapter that uses files in development and Vercel KV in production
 * This allows the CMS to work on Vercel's read-only filesystem
 */

import fs from 'fs'
import path from 'path'

// Check if we're on Vercel (has KV environment variables)
const isVercel = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN
const isDevelopment = process.env.NODE_ENV === 'development'

// Use file storage in development, KV in production (Vercel)
export const USE_KV = isVercel && !isDevelopment

let kvClient: any = null

async function getKVClient(): Promise<any> {
  if (!USE_KV) return null
  
  if (!kvClient) {
    try {
      // Dynamic import to avoid build errors when @vercel/kv is not installed
      // Using type assertion to avoid TypeScript errors if package is missing
      const kvModule = await import('@vercel/kv' as any).catch(() => null)
      if (!kvModule) {
        return null
      }
      kvClient = kvModule.kv || kvModule.default || kvModule
    } catch (error) {
      // @vercel/kv not available - this is fine, we'll use file system
      console.warn('Vercel KV not available, falling back to file system:', error instanceof Error ? error.message : 'Unknown error')
      return null
    }
  }
  return kvClient
}

/**
 * Read a value from storage
 */
export async function storageGet(key: string): Promise<string | null> {
  // Try KV first if available
  if (USE_KV) {
    const kv = await getKVClient()
    if (kv) {
      try {
        const value = await kv.get(key)
        if (value !== null) {
          return value as string
        }
        // If KV returns null, fall through to file system
      } catch (error) {
        console.error('KV get error:', error)
        // Fall through to file system on error
      }
    }
  }
  
  // Fallback to file system (works in development and for committed files on Vercel)
  try {
    const filePath = path.join(process.cwd(), key)
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8')
    }
  } catch (error) {
    // File doesn't exist or can't be read
  }
  return null
}

/**
 * Write a value to storage
 */
export async function storageSet(key: string, value: string): Promise<boolean> {
  if (USE_KV) {
    const kv = await getKVClient()
    if (kv) {
      try {
        await kv.set(key, value)
        return true
      } catch (error) {
        console.error('KV set error:', error)
        return false
      }
    }
  }
  
  // Fallback to file system (works in development)
  try {
    const filePath = path.join(process.cwd(), key)
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, value, 'utf-8')
    return true
  } catch (error) {
    console.error('File write error:', error)
    return false
  }
}

/**
 * Delete a value from storage
 */
export async function storageDelete(key: string): Promise<boolean> {
  if (USE_KV) {
    const kv = await getKVClient()
    if (kv) {
      try {
        await kv.del(key)
        return true
      } catch (error) {
        console.error('KV delete error:', error)
        return false
      }
    }
  }
  
  // Fallback to file system
  try {
    const filePath = path.join(process.cwd(), key)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
  } catch (error) {
    console.error('File delete error:', error)
  }
  return false
}

/**
 * List all keys with a prefix
 */
export async function storageList(prefix: string): Promise<string[]> {
  // Try KV first if available
  if (USE_KV) {
    const kv = await getKVClient()
    if (kv) {
      try {
        const keys = await kv.keys(`${prefix}*`)
        const kvKeys = (keys as string[]).map(key => key.replace(prefix, ''))
        // If KV has keys, return them; otherwise fall through to file system
        if (kvKeys.length > 0) {
          return kvKeys
        }
        // If KV is empty, fall through to file system
      } catch (error) {
        console.error('KV list error:', error)
        // Fall through to file system on error
      }
    }
  }
  
  // Fallback to file system (works in development and for committed files on Vercel)
  try {
    const dir = path.join(process.cwd(), prefix)
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return fs.readdirSync(dir)
    }
  } catch (error) {
    // Directory doesn't exist
  }
  return []
}

/**
 * Check if a key exists
 */
export async function storageExists(key: string): Promise<boolean> {
  if (USE_KV) {
    const kv = await getKVClient()
    if (kv) {
      try {
        const value = await kv.get(key)
        return value !== null
      } catch (error) {
        return false
      }
    }
  }
  
  // Fallback to file system
  try {
    const filePath = path.join(process.cwd(), key)
    return fs.existsSync(filePath)
  } catch (error) {
    return false
  }
}

