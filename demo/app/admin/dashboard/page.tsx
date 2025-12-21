'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ConfirmModal'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date: string
  author?: string
}

interface SiteConfig {
  siteTitle: string
  siteSubtitle: string
  postRoute: string
  pageRoute: string
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [config, setConfig] = useState<SiteConfig>({ siteTitle: 'My Blog', siteSubtitle: 'Welcome to our simple file-based CMS', postRoute: 'posts', pageRoute: '' })
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; slug: string | null }>({ isOpen: false, slug: null })
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' })
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
    loadPosts()
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }

    // Verify token is still valid by checking with API
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok && response.status === 401) {
        // Token is invalid, clear it and redirect
        localStorage.removeItem('admin_token')
        router.push('/admin')
      }
    } catch (err) {
      // If settings API fails, still allow access (might be network issue)
      // But if it's a 401, we know the token is invalid
    }
  }

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      } else {
        console.error('Failed to load posts:', response.status, response.statusText)
      }
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin')
  }

  const handleDeleteClick = (slug: string) => {
    setDeleteModal({ isOpen: true, slug })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.slug) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/posts/${deleteModal.slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setDeleteModal({ isOpen: false, slug: null })
        loadPosts()
      } else {
        setDeleteModal({ isOpen: false, slug: null })
        setErrorModal({ isOpen: true, message: 'Failed to delete post' })
      }
    } catch (err) {
      setDeleteModal({ isOpen: false, slug: null })
      setErrorModal({ isOpen: true, message: 'Error deleting post' })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, slug: null })
  }

  // Don't render if not on localhost
  if (!isLocalhost) {
    return null
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
          <Link href="/" style={{ color: '#0070f3' }}>View Site</Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            href="/admin/dashboard/settings"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Settings
          </Link>
          <Link
            href="/admin/dashboard/new"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            New Post
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <section>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Posts</h2>
        
        {posts.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            background: 'white', 
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p>No posts yet. Create your first post!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    {post.title}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    {post.slug} • {new Date(post.date).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    href={config.postRoute ? `/${config.postRoute}/${post.slug}` : `/${post.slug}`}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f0f0f0',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/dashboard/edit/${encodeURIComponent(post.slug)}`}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(post.slug)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />

      <ConfirmModal
        isOpen={errorModal.isOpen}
        title="Error"
        message={errorModal.message}
        confirmText="OK"
        onConfirm={() => setErrorModal({ isOpen: false, message: '' })}
        onCancel={() => setErrorModal({ isOpen: false, message: '' })}
        variant="info"
      />
    </main>
  )
}

function SettingsEditor({ config, onClose }: { config: SiteConfig; onClose: () => void }) {
  const [siteTitle, setSiteTitle] = useState(config.siteTitle !== undefined ? config.siteTitle : 'My Blog')
  const [siteSubtitle, setSiteSubtitle] = useState(config.siteSubtitle !== undefined ? config.siteSubtitle : 'Welcome to our simple file-based CMS')
  const [postRoute, setPostRoute] = useState(config.postRoute !== undefined ? config.postRoute : 'posts')
  const [pageRoute, setPageRoute] = useState(config.pageRoute !== undefined ? config.pageRoute : '')
  const [saving, setSaving] = useState(false)

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
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
        onClose()
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

  return (
    <div 
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Site Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
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
      </div>
    </div>
  )
}

