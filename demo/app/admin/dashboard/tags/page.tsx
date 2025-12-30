'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ConfirmModal'

// Force dynamic rendering - this page uses browser-only APIs
export const dynamic = 'force-dynamic'

interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  locale?: string
}

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

export default function TagsPage() {
  const searchParams = useSearchParams()
  const urlLocale = searchParams.get('locale')
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [locale, setLocale] = useState<string>('')
  const [config, setConfig] = useState<SiteConfig>({ siteTitle: 'My Blog', siteSubtitle: 'Welcome to our simple file-based CMS', postRoute: 'posts', pageRoute: '', defaultLocale: 'en', locales: [] })
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; slug: string | null; locale?: string }>({ isOpen: false, slug: null })
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' })
  const [editModal, setEditModal] = useState<{ isOpen: boolean; tag: Tag | null }>({ isOpen: false, tag: null })
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({})
  const router = useRouter()

  useEffect(() => {
    // Check if we're on localhost
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const localhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.0.')
      setIsLocalhost(localhost)
      
      if (!localhost) {
        router.push('/')
        return
      }
    }
    
    checkAuth()
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        if (urlLocale && data.locales?.some((l: Locale) => l.code === urlLocale && l.enabled)) {
          setLocale(urlLocale)
        } else if (!locale && data.defaultLocale) {
          setLocale(data.defaultLocale)
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  useEffect(() => {
    if (urlLocale && config.locales?.some((l: Locale) => l.code === urlLocale && l.enabled)) {
      setLocale(urlLocale)
    } else if (config.defaultLocale && !locale) {
      setLocale(config.defaultLocale)
    }
  }, [config.defaultLocale, config.locales, locale, urlLocale])

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
  }

  const loadTags = async (selectedLocale?: string) => {
    try {
      const localeToUse = selectedLocale || locale || config.defaultLocale || 'en'
      const [tagsRes, countsRes] = await Promise.all([
        fetch(`/api/tags?locale=${localeToUse}`),
        fetch(`/api/tags/counts?locale=${localeToUse}`)
      ])
      
      if (tagsRes.ok) {
        const data = await tagsRes.json()
        setTags(data)
      }
      
      if (countsRes.ok) {
        const counts = await countsRes.json()
        setTagCounts(counts)
      }
    } catch (err) {
      console.error('Failed to load tags:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const localeToUse = locale || urlLocale || config.defaultLocale || 'en'
    if (localeToUse) {
      loadTags(localeToUse)
    }
  }, [locale, urlLocale, config.defaultLocale])

  const handleDeleteClick = (slug: string) => {
    setDeleteModal({ isOpen: true, slug, locale: locale || config.defaultLocale })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.slug) return

    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        setErrorModal({ isOpen: true, message: 'Not authenticated. Please log in again.' })
        setDeleteModal({ isOpen: false, slug: null })
        router.push('/admin')
        return
      }
      
      const deleteLocale = deleteModal.locale || locale || config.defaultLocale
      const response = await fetch(`/api/tags/${encodeURIComponent(deleteModal.slug)}?locale=${deleteLocale}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setDeleteModal({ isOpen: false, slug: null })
        loadTags(locale || config.defaultLocale)
      } else {
        const data = await response.json()
        const errorMsg = data.error || data.details || 'Failed to delete tag'
        setDeleteModal({ isOpen: false, slug: null })
        setErrorModal({ isOpen: true, message: errorMsg })
        // If token is invalid, redirect to login
        if (response.status === 401) {
          localStorage.removeItem('admin_token')
          setTimeout(() => router.push('/admin'), 2000)
        }
      }
    } catch (err) {
      console.error('Error deleting tag:', err)
      setDeleteModal({ isOpen: false, slug: null })
      setErrorModal({ isOpen: true, message: 'Error deleting tag: ' + (err instanceof Error ? err.message : 'Unknown error') })
    }
  }

  const handleEditClick = (tag: Tag) => {
    setEditModal({ isOpen: true, tag })
  }

  const handleCreateClick = () => {
    setEditModal({ 
      isOpen: true, 
      tag: {
        id: '',
        name: '',
        slug: '',
        description: '',
        locale: locale || config.defaultLocale
      }
    })
  }

  const handleSaveTag = async (tag: Tag) => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        setErrorModal({ isOpen: true, message: 'Not authenticated. Please log in again.' })
        router.push('/admin')
        return
      }
      
      const localeToUse = tag.locale || locale || config.defaultLocale
      
      const method = tag.id ? 'PUT' : 'POST'
      const url = tag.id 
        ? `/api/tags/${encodeURIComponent(tag.slug)}?locale=${localeToUse}`
        : `/api/tags`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...tag,
          locale: localeToUse
        })
      })

      if (response.ok) {
        setEditModal({ isOpen: false, tag: null })
        loadTags(localeToUse)
      } else {
        const data = await response.json()
        const errorMsg = data.error || data.details || 'Failed to save tag'
        setErrorModal({ isOpen: true, message: errorMsg })
        // If token is invalid, redirect to login
        if (response.status === 401) {
          localStorage.removeItem('admin_token')
          setTimeout(() => router.push('/admin'), 2000)
        }
      }
    } catch (err) {
      console.error('Error saving tag:', err)
      setErrorModal({ isOpen: true, message: 'Error saving tag: ' + (err instanceof Error ? err.message : 'Unknown error') })
    }
  }

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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Tags</h1>
          <Link href="/admin/dashboard" style={{ color: '#0070f3' }}>← Back to Dashboard</Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Locale:</label>
          <select
            value={locale || config.defaultLocale}
            onChange={(e) => {
              const newLocale = e.target.value
              setLocale(newLocale)
              loadTags(newLocale)
              router.push(`/admin/dashboard/tags?locale=${newLocale}`)
            }}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.9rem',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {config.locales?.filter(l => l.enabled).map((loc) => (
              <option key={loc.code} value={loc.code}>
                {loc.name} ({loc.code})
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateClick}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            New Tag
          </button>
        </div>
      </header>

      <section>
        {tags.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            background: 'white', 
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p>No tags yet. Create your first tag!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tags.map((tag) => (
              <div
                key={tag.id}
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
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                      {tag.name}
                    </h3>
                    {tagCounts[tag.slug] !== undefined && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        borderRadius: '12px',
                        backgroundColor: '#28a745',
                        color: 'white'
                      }}>
                        {tagCounts[tag.slug]} {tagCounts[tag.slug] === 1 ? 'post' : 'posts'}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                    {tag.slug}
                    {tag.description && ` • ${tag.description}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEditClick(tag)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(tag.slug)}
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

      {editModal.isOpen && editModal.tag && (
        <TagEditModal
          tag={editModal.tag}
          onSave={handleSaveTag}
          onClose={() => setEditModal({ isOpen: false, tag: null })}
        />
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone. Posts using this tag will not be deleted, but the tag reference will be removed."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, slug: null })}
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

function TagEditModal({ 
  tag, 
  onSave, 
  onClose 
}: { 
  tag: Tag
  onSave: (tag: Tag) => void
  onClose: () => void 
}) {
  const [name, setName] = useState(tag.name)
  const [slug, setSlug] = useState(tag.slug)
  const [description, setDescription] = useState(tag.description || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const slugToUse = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    onSave({
      ...tag,
      name,
      slug: slugToUse,
      description
    })
  }

  return (
    <div 
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
          <h2 style={{ fontSize: '1.5rem' }}>{tag.id ? 'Edit Tag' : 'New Tag'}</h2>
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
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!tag.id && !slug) {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                }
              }}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
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
              style={{
                padding: '0.75rem 1.5rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

