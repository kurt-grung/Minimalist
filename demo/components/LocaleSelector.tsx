'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Locale {
  code: string
  name: string
  enabled: boolean
}

interface LocaleSelectorProps {
  locales: Locale[]
  currentLocale: string
  defaultLocale: string
  currentPath?: string // Optional path to preserve (e.g., '/english-title')
}

export default function LocaleSelector({ locales, currentLocale, defaultLocale, currentPath }: LocaleSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedLocale, setSelectedLocale] = useState(currentLocale || defaultLocale)

  useEffect(() => {
    setSelectedLocale(currentLocale || defaultLocale)
  }, [currentLocale, defaultLocale])

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value
    setSelectedLocale(newLocale)
    
    // Build new URL with locale as path segment
    let newPath = currentPath || pathname
    
    // Remove existing locale from path if present
    const enabledLocaleCodes = locales.filter(l => l.enabled).map(l => l.code)
    const pathSegments = newPath.split('/').filter(Boolean)
    
    // Remove locale if it's the first segment
    if (pathSegments.length > 0 && enabledLocaleCodes.includes(pathSegments[0])) {
      pathSegments.shift()
    }
    
    // Build new path
    if (newLocale === defaultLocale) {
      // Default locale: no locale prefix
      newPath = pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '/'
    } else {
      // Non-default locale: add locale prefix
      newPath = pathSegments.length > 0 
        ? `/${newLocale}/${pathSegments.join('/')}`
        : `/${newLocale}`
    }
    
    router.push(newPath)
    // Reload the page to show content in the new locale
    router.refresh()
  }

  const enabledLocales = locales.filter(l => l.enabled)

  if (enabledLocales.length <= 1) {
    return null // Don't show selector if only one locale
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem',
      marginBottom: '1rem'
    }}>
      <label style={{ 
        fontSize: '0.9rem', 
        fontWeight: '500',
        color: '#666'
      }}>
        Language:
      </label>
      <select
        value={selectedLocale}
        onChange={handleLocaleChange}
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '0.9rem',
          backgroundColor: 'white',
          cursor: 'pointer',
          color: '#333'
        }}
      >
        {enabledLocales.map((locale) => (
          <option key={locale.code} value={locale.code}>
            {locale.name} ({locale.code})
          </option>
        ))}
      </select>
    </div>
  )
}

