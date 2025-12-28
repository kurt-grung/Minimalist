'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ConfirmModal'

// Force dynamic rendering - this page uses browser-only APIs
export const dynamic = 'force-dynamic'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
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

export default function CategoriesPage() {
  const searchParams = useSearchParams()
  const urlLocale = searchParams.get('locale')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [locale, setLocale] = useState<string>('')
  const [config, setConfig] = useState<SiteConfig>({ siteTitle: 'My Blog', siteSubtitle: 'Welcome to our simple file-based CMS', postRoute: 'posts', pageRoute: '', defaultLocale: 'en', locales: [] })
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; slug: string | null; locale?: string }>({ isOpen: false, slug: null })
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' })
  const [editModal, setEditModal] = useState<{ isOpen: boolean; category: Category | null }>({ isOpen: false, category: null })
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
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

  const loadCategories = async (selectedLocale?: string) => {
    try {
      const localeToUse = selectedLocale || locale || config.defaultLocale || 'en'
      const [categoriesRes, countsRes] = await Promise.all([
        fetch(`/api/categories?locale=${localeToUse}`),
        fetch(`/api/categories/counts?locale=${localeToUse}`)
      ])
      
      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data)
      }
      
      if (countsRes.ok) {
        const counts = await countsRes.json()
        setCategoryCounts(counts)
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const localeToUse = locale || urlLocale || config.defaultLocale || 'en'
    if (localeToUse) {
      loadCategories(localeToUse)
    }
  }, [locale, urlLocale, config.defaultLocale])

  const handleDeleteClick = (slug: string) => {
    setDeleteModal({ isOpen: true, slug, locale: locale || config.defaultLocale })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.slug) return

    try {
      const token = localStorage.getItem('admin_token')
      const deleteLocale = deleteModal.locale || locale || config.defaultLocale
      const response = await fetch(`/api/categories/${deleteModal.slug}?locale=${deleteLocale}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setDeleteModal({ isOpen: false, slug: null })
        loadCategories(locale || config.defaultLocale)
      } else {
        setDeleteModal({ isOpen: false, slug: null })
        setErrorModal({ isOpen: true, message: 'Failed to delete category' })
      }
    } catch (err) {
      setDeleteModal({ isOpen: false, slug: null })
      setErrorModal({ isOpen: true, message: 'Error deleting category' })
    }
  }

  const handleEditClick = (category: Category) => {
    setEditModal({ isOpen: true, category })
  }

  const handleCreateClick = () => {
    setEditModal({ 
      isOpen: true, 
      category: {
        id: '',
        name: '',
        slug: '',
        description: '',
        locale: locale || config.defaultLocale
      }
    })
  }

  const handleSaveCategory = async (category: Category) => {
    try {
      const token = localStorage.getItem('admin_token')
      const localeToUse = category.locale || locale || config.defaultLocale
      
      const method = category.id ? 'PUT' : 'POST'
      const url = category.id 
        ? `/api/categories/${category.slug}?locale=${localeToUse}`
        : `/api/categories`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...category,
          locale: localeToUse
        })
      })

      if (response.ok) {
        setEditModal({ isOpen: false, category: null })
        loadCategories(localeToUse)
      } else {
        const data = await response.json()
        setErrorModal({ isOpen: true, message: data.error || 'Failed to save category' })
      }
    } catch (err) {
      setErrorModal({ isOpen: true, message: 'Error saving category' })
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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Categories</h1>
          <Link href="/admin/dashboard" style={{ color: '#0070f3' }}>← Back to Dashboard</Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Locale:</label>
          <select
            value={locale || config.defaultLocale}
            onChange={(e) => {
              const newLocale = e.target.value
              setLocale(newLocale)
              loadCategories(newLocale)
              router.push(`/admin/dashboard/categories?locale=${newLocale}`)
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
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            New Category
          </button>
        </div>
      </header>

      <section>
        {categories.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            background: 'white', 
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p>No categories yet. Create your first category!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {categories.map((category) => (
              <div
                key={category.id}
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
                      {category.name}
                    </h3>
                    {categoryCounts[category.slug] !== undefined && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        borderRadius: '12px',
                        backgroundColor: '#0070f3',
                        color: 'white'
                      }}>
                        {categoryCounts[category.slug]} {categoryCounts[category.slug] === 1 ? 'post' : 'posts'}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                    {category.slug}
                    {category.description && ` • ${category.description}`}
                    {category.parentId && ` • Parent: ${category.parentId}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEditClick(category)}
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
                    onClick={() => handleDeleteClick(category.slug)}
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

      {editModal.isOpen && editModal.category && (
        <CategoryEditModal
          category={editModal.category}
          categories={categories}
          onSave={handleSaveCategory}
          onClose={() => setEditModal({ isOpen: false, category: null })}
        />
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone. Posts using this category will not be deleted, but the category reference will be removed."
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

function CategoryEditModal({ 
  category, 
  categories,
  onSave, 
  onClose 
}: { 
  category: Category
  categories: Category[]
  onSave: (category: Category) => void
  onClose: () => void 
}) {
  const [name, setName] = useState(category.name)
  const [slug, setSlug] = useState(category.slug)
  const [description, setDescription] = useState(category.description || '')
  const [parentId, setParentId] = useState(category.parentId || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const slugToUse = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    onSave({
      ...category,
      name,
      slug: slugToUse,
      description,
      parentId: parentId || undefined
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
          <h2 style={{ fontSize: '1.5rem' }}>{category.id ? 'Edit Category' : 'New Category'}</h2>
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
                if (!category.id && !slug) {
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Parent Category (for hierarchical structure)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">None (Top-level category)</option>
              {categories.filter(c => c.id !== category.id).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
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

