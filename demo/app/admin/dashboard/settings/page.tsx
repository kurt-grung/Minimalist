'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Force dynamic rendering - this page uses browser-only APIs
export const dynamic = 'force-dynamic'

interface Locale {
  code: string
  name: string
  enabled: boolean
}

interface SiteConfig {
  siteTitle: string
  siteSubtitle: string
  postRoute: string
  pageRoute: string
  defaultLocale: string
  locales: Locale[]
}

export default function SettingsPage() {
  const [siteTitle, setSiteTitle] = useState('')
  const [siteSubtitle, setSiteSubtitle] = useState('')
  const [postRoute, setPostRoute] = useState('')
  const [pageRoute, setPageRoute] = useState('')
  const [defaultLocale, setDefaultLocale] = useState('en')
  const [locales, setLocales] = useState<Locale[]>([{ code: 'en', name: 'English', enabled: true }])
  const [newLocaleCode, setNewLocaleCode] = useState('')
  const [newLocaleName, setNewLocaleName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [config, setConfig] = useState<SiteConfig>({ 
    siteTitle: 'My Blog', 
    siteSubtitle: 'Welcome to our simple file-based CMS', 
    postRoute: 'posts', 
    pageRoute: '',
    defaultLocale: 'en',
    locales: [{ code: 'en', name: 'English', enabled: true }]
  })
  const router = useRouter()

  useEffect(() => {
    // Check if we're on localhost
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const localhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.0.')
      setIsLocalhost(localhost)
      
      if (!localhost) {
        // Redirect to home if not on localhost
        router.push('/')
        return
      }
    }
    
    checkAuth()
    loadSettings()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setSiteTitle(data.siteTitle ?? 'My Blog')
        setSiteSubtitle(data.siteSubtitle ?? 'Welcome to our simple file-based CMS')
        // Use nullish coalescing to preserve empty strings (empty string means root route)
        setPostRoute(data.postRoute ?? 'posts')
        setPageRoute(data.pageRoute ?? '')
        setDefaultLocale(data.defaultLocale ?? 'en')
        setLocales(data.locales ?? [{ code: 'en', name: 'English', enabled: true }])
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          siteTitle: siteTitle.trim(),
          siteSubtitle: siteSubtitle.trim(),
          postRoute: postRoute.trim(),
          pageRoute: pageRoute.trim(),
          defaultLocale: defaultLocale,
          locales: locales
        })
      })

      if (response.ok) {
        router.push('/admin/dashboard')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save settings')
      }
    } catch (err) {
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const addLocale = () => {
    if (!newLocaleCode.trim() || !newLocaleName.trim()) {
      alert('Please enter both locale code and name')
      return
    }
    const code = newLocaleCode.trim().toLowerCase()
    if (locales.some(l => l.code === code)) {
      alert('Locale with this code already exists')
      return
    }
    setLocales([...locales, { code, name: newLocaleName.trim(), enabled: true }])
    setNewLocaleCode('')
    setNewLocaleName('')
  }

  const removeLocale = (code: string) => {
    if (code === defaultLocale) {
      alert('Cannot remove the default locale. Please set another locale as default first.')
      return
    }
    if (locales.length === 1) {
      alert('Cannot remove the last locale')
      return
    }
    setLocales(locales.filter(l => l.code !== code))
  }

  const toggleLocale = (code: string) => {
    if (code === defaultLocale && locales.find(l => l.code === code)?.enabled) {
      alert('Cannot disable the default locale. Please set another locale as default first.')
      return
    }
    setLocales(locales.map(l => 
      l.code === code ? { ...l, enabled: !l.enabled } : l
    ))
  }

  // Don't render if not on localhost
  if (!isLocalhost) {
    return null
  }

  if (loading) {
    return (
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <p>Loading settings...</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Site Settings</h1>
          <Link href="/admin/dashboard" style={{ color: '#0070f3' }}>← Back to Dashboard</Link>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Site Title
          </label>
          <input
            type="text"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="My Blog"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: siteTitle !== config.siteTitle ? '2px solid #ff9800' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            The title displayed on your homepage
          </p>
          {siteTitle !== config.siteTitle && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
              ⚠️ Changing this will update the site title on the homepage.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Site Subtitle
          </label>
          <input
            type="text"
            value={siteSubtitle}
            onChange={(e) => setSiteSubtitle(e.target.value)}
            placeholder="Welcome to our simple file-based CMS"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: siteSubtitle !== config.siteSubtitle ? '2px solid #ff9800' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            The subtitle text displayed below the site title on your homepage
          </p>
          {siteSubtitle !== config.siteSubtitle && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
              ⚠️ Changing this will update the subtitle on the homepage.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={postRoute}
            onChange={(e) => setPostRoute(e.target.value)}
            placeholder="posts"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: postRoute !== config.postRoute ? '2px solid #ff9800' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            URL prefix for posts (e.g., "posts" = /posts/[slug], "blog" = /blog/[slug], leave empty for root)
          </p>
          {postRoute !== config.postRoute && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
              ⚠️ Changing this will update all post URLs. Existing links will need to be updated.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Page Route Prefix
          </label>
          <input
            type="text"
            value={pageRoute}
            onChange={(e) => setPageRoute(e.target.value)}
            placeholder="(empty for root)"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: pageRoute !== config.pageRoute ? '2px solid #ff9800' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            URL prefix for pages (e.g., "pages" = /pages/[slug], leave empty for root)
          </p>
          {pageRoute !== config.pageRoute && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
              ⚠️ Changing this will update all page URLs. Existing links will need to be updated.
            </p>
          )}
        </div>

        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1.5rem', 
          background: '#f9f9f9', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>
            Multi-Language Support
          </h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Default Locale
            </label>
            <select
              value={defaultLocale}
              onChange={(e) => setDefaultLocale(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                background: 'white'
              }}
            >
              {locales.filter(l => l.enabled).map(locale => (
                <option key={locale.code} value={locale.code}>
                  {locale.name} ({locale.code})
                </option>
              ))}
            </select>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              The default language for your site
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Available Locales
            </label>
            <div style={{ marginBottom: '1rem' }}>
              {locales.map(locale => (
                <div 
                  key={locale.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: 'white',
                    borderRadius: '6px',
                    border: locale.code === defaultLocale ? '2px solid #0070f3' : '1px solid #ddd'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="checkbox"
                      checked={locale.enabled}
                      onChange={() => toggleLocale(locale.code)}
                      disabled={locale.code === defaultLocale}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: locale.code === defaultLocale ? '600' : '400' }}>
                      {locale.name} ({locale.code})
                      {locale.code === defaultLocale && (
                        <span style={{ marginLeft: '0.5rem', color: '#0070f3', fontSize: '0.85rem' }}>
                          [Default]
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLocale(locale.code)}
                    disabled={locale.code === defaultLocale || locales.length === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      background: locale.code === defaultLocale || locales.length === 1 ? '#f0f0f0' : '#dc3545',
                      color: locale.code === defaultLocale || locales.length === 1 ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: locale.code === defaultLocale || locales.length === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'white', 
            borderRadius: '6px',
            border: '1px dashed #ddd'
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '500' }}>
              Add New Locale
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={newLocaleCode}
                onChange={(e) => setNewLocaleCode(e.target.value)}
                placeholder="Code (e.g., es, fr, de)"
                style={{
                  flex: '1',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
                maxLength={5}
              />
              <input
                type="text"
                value={newLocaleName}
                onChange={(e) => setNewLocaleName(e.target.value)}
                placeholder="Name (e.g., Spanish, French)"
                style={{
                  flex: '2',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="button"
                onClick={addLocale}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Add
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
              Locale code should be 2-5 characters (e.g., "en", "es", "fr", "zh-CN")
            </p>
          </div>
        </div>

        {/* Backup & Export Section */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          background: 'white', 
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>
            Backup & Export
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
            Export all your content as JSON for backup or import it back later.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  const token = localStorage.getItem('admin_token')
                  if (!token) {
                    alert('Not authenticated')
                    return
                  }

                  const response = await fetch('/api/backup/export', {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  })

                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `cms-backup-${new Date().toISOString().split('T')[0]}.json`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    alert('Backup exported successfully!')
                  } else {
                    const data = await response.json()
                    alert(data.error || 'Failed to export backup')
                  }
                } catch (error) {
                  alert('Error exporting backup: ' + (error instanceof Error ? error.message : 'Unknown error'))
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              📥 Export Backup
            </button>
            
            <label
              style={{
                padding: '0.75rem 1.5rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-block'
              }}
            >
              📤 Import Backup
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  try {
                    const token = localStorage.getItem('admin_token')
                    if (!token) {
                      alert('Not authenticated')
                      return
                    }

                    const text = await file.text()
                    const backup = JSON.parse(text)

                    if (!confirm('This will import all content from the backup. Existing content with the same slugs will be overwritten. Continue?')) {
                      return
                    }

                    const response = await fetch('/api/backup/import', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify(backup)
                    })

                    const data = await response.json()
                    if (response.ok) {
                      alert(`Import successful! ${data.message}`)
                      router.refresh()
                    } else {
                      alert(data.error || 'Failed to import backup')
                    }
                  } catch (error) {
                    alert('Error importing backup: ' + (error instanceof Error ? error.message : 'Unknown error'))
                  }
                  
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Link
            href="/admin/dashboard"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f0f0f0',
              borderRadius: '6px',
              fontSize: '1rem',
              textDecoration: 'none',
              color: 'black',
              display: 'inline-block'
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: saving ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </main>
  )
}

