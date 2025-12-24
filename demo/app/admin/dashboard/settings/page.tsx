'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SiteConfig {
  siteTitle: string
  siteSubtitle: string
  postRoute: string
  pageRoute: string
}

export default function SettingsPage() {
  const [siteTitle, setSiteTitle] = useState('')
  const [siteSubtitle, setSiteSubtitle] = useState('')
  const [postRoute, setPostRoute] = useState('')
  const [pageRoute, setPageRoute] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [config, setConfig] = useState<SiteConfig>({ siteTitle: 'My Blog', siteSubtitle: 'Welcome to our simple file-based CMS', postRoute: 'posts', pageRoute: '' })
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
          pageRoute: pageRoute.trim()
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
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Post Route Prefix
          </label>
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

