'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'
import ConfirmModal from '@/components/ConfirmModal'

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

interface LocaleFormState {
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
}

export default function NewPostPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('published')
  const [scheduledDate, setScheduledDate] = useState('')
  const [locale, setLocale] = useState<string>('')
  const [localeStates, setLocaleStates] = useState<Record<string, LocaleFormState>>({})
  const [saving, setSaving] = useState(false)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' })
  const [config, setConfig] = useState<SiteConfig>({ siteTitle: 'My Blog', siteSubtitle: 'Welcome to our simple file-based CMS', postRoute: 'posts', pageRoute: '', defaultLocale: 'en', locales: [] })
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

  // Initialize locale when config loads
  useEffect(() => {
    if (config.defaultLocale && !locale) {
      setLocale(config.defaultLocale)
    }
  }, [config.defaultLocale, locale])

  // Save current form state to localeStates as user types
  useEffect(() => {
    const currentLocale = locale || config.defaultLocale
    if (currentLocale) {
      setLocaleStates(prev => ({
        ...prev,
        [currentLocale]: {
          title,
          slug,
          content,
          excerpt,
          author
        }
      }))
    }
  }, [title, slug, content, excerpt, author, locale, config.defaultLocale])

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
        // Set default locale if not already set
        if (!locale && data.defaultLocale) {
          setLocale(data.defaultLocale)
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const postRouteCapitalized = postRoute ? (postRoute.charAt(0).toUpperCase() + postRoute.slice(1)) : ''

  // Auto-save as draft when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (title || content) {
        saveDraft()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [title, content])

  const saveDraft = async () => {
    if (!title && !content) return

    try {
      const token = localStorage.getItem('admin_token')
      const finalSlug = slug || (title ? title.toLowerCase().replace(/\s+/g, '-') : `draft-${Date.now()}`)
      
      // Save to localStorage as backup
      const draftData = {
        title,
        slug: finalSlug,
        content,
        excerpt,
        author,
        date: new Date().toISOString(),
        isDraft: true
      }
      localStorage.setItem(`draft_${finalSlug}`, JSON.stringify(draftData))

      // Save to server as draft
      if (finalSlug && (title || content)) {
        await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: title || 'Untitled Draft',
            slug: finalSlug,
            content,
            excerpt,
            author,
            date: new Date().toISOString(),
            locale: locale || config.defaultLocale
          })
        })
      }
    } catch (err) {
      console.log('Draft saved to localStorage')
    }
  }

  // Convert title to slug format
  const titleToSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
  }

  // Generate excerpt from content
  const generateExcerpt = (content: string): string => {
    if (!content) return ''
    
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    if (!text) return ''
    
    // Try to get first 2 sentences (up to 150 characters)
    const sentences = text.match(/[^.!?]+[.!?]+/g)
    if (sentences && sentences.length > 0) {
      let excerpt = sentences[0]
      if (sentences.length > 1 && excerpt.length < 100) {
        excerpt += ' ' + sentences[1]
      }
      // Limit to 150 characters
      if (excerpt.length > 150) {
        excerpt = excerpt.substring(0, 147) + '...'
      }
      return excerpt.trim()
    }
    
    // Fallback: first 150 characters
    if (text.length > 150) {
      return text.substring(0, 147) + '...'
    }
    
    return text
  }

  // Save current form state to localeStates before switching
  const saveCurrentLocaleState = (currentLocale: string) => {
    if (currentLocale) {
      setLocaleStates(prev => ({
        ...prev,
        [currentLocale]: {
          title,
          slug,
          content,
          excerpt,
          author
        }
      }))
    }
  }

  // Restore form state for a locale
  const restoreLocaleState = (targetLocale: string) => {
    const savedState = localeStates[targetLocale]
    if (savedState) {
      setTitle(savedState.title)
      setSlug(savedState.slug)
      setContent(savedState.content)
      setExcerpt(savedState.excerpt)
      setAuthor(savedState.author)
    } else {
      // No saved state, clear everything
      setTitle('')
      setSlug('')
      setContent('')
      setExcerpt('')
      setAuthor('')
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    // Auto-update slug based on title
    if (newTitle) {
      setSlug(titleToSlug(newTitle))
    } else {
      setSlug('')
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    // Auto-generate excerpt from content if excerpt is empty or matches previous auto-generated one
    if (!excerpt || excerpt === generateExcerpt(content)) {
      setExcerpt(generateExcerpt(newContent))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('admin_token')
      const finalSlug = slug || title.toLowerCase().replace(/\s+/g, '-')
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
          body: JSON.stringify({
            title,
            slug: finalSlug,
            content,
            excerpt,
            author,
            status,
            scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
            date: new Date().toISOString(),
            locale: locale || config.defaultLocale
          })
      })

      if (!response.ok) {
        const data = await response.json()
        setSaving(false)
        setErrorModal({
          isOpen: true,
          message: data.error || 'Failed to save post'
        })
        return
      }

      // Clear draft from localStorage
      localStorage.removeItem(`draft_${finalSlug}`)
      
      router.push('/admin/dashboard')
    } catch (err) {
      setSaving(false)
      setErrorModal({
        isOpen: true,
        message: 'Error saving post'
      })
    }
  }

  // Don't render if not on localhost
  if (!isLocalhost) {
    return null
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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>New {postRouteCapitalized || 'Post'}</h1>
          <Link href="/admin/dashboard" style={{ color: '#0070f3' }}>← Back to Dashboard</Link>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
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

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-post-title"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            URL will be: <span style={{ fontFamily: 'monospace', color: '#0070f3' }}>
              {postRoute ? `/${postRoute}/${slug || 'your-slug'}` : `/${slug || 'your-slug'}`}
            </span>
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Locale *
          </label>
          <select
            value={locale || config.defaultLocale}
            onChange={(e) => {
              const newLocale = e.target.value
              const currentLocale = locale || config.defaultLocale
              
              // Save current form state before switching
              if (currentLocale) {
                saveCurrentLocaleState(currentLocale)
              }
              
              // Switch to new locale
              setLocale(newLocale)
              
              // Restore form state for the new locale (or clear if no saved state)
              restoreLocaleState(newLocale)
            }}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
              backgroundColor: 'white'
            }}
          >
            {config.locales?.filter(l => l.enabled).map((loc) => (
              <option key={loc.code} value={loc.code}>
                {loc.name} ({loc.code})
              </option>
            ))}
          </select>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            Select the language for this post
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Author
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Status *
          </label>
          <select
            value={status}
            onChange={(e) => {
              const newStatus = e.target.value as 'draft' | 'published' | 'scheduled'
              setStatus(newStatus)
              // Clear scheduled date if not scheduled
              if (newStatus !== 'scheduled') {
                setScheduledDate('')
              }
            }}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
              backgroundColor: 'white'
            }}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            {status === 'draft' && 'Draft posts are not visible on the frontend unless previewed.'}
            {status === 'published' && 'Published posts are immediately visible on the frontend.'}
            {status === 'scheduled' && 'Scheduled posts will be published automatically on the scheduled date.'}
          </p>
        </div>

        {status === 'scheduled' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required={status === 'scheduled'}
              min={new Date().toISOString().slice(0, 16)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              The post will be automatically published at this date and time.
            </p>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Content *
          </label>
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Start writing your content..."
          />
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
            onClick={saveDraft}
          >
            Cancel
          </Link>
          {status === 'draft' && slug && (
            <Link
              href={`${config.postRoute ? `/${config.postRoute}/${slug}` : `/${slug}`}?preview=true`}
              target="_blank"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#9c27b0',
                color: 'white',
                borderRadius: '6px',
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Preview Draft
            </Link>
          )}
          <button
            type="submit"
            disabled={saving || (status === 'scheduled' && !scheduledDate)}
            style={{
              padding: '0.75rem 1.5rem',
              background: saving ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: saving || (status === 'scheduled' && !scheduledDate) ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : `Save ${postRouteCapitalized || 'Post'}`}
          </button>
        </div>
      </form>

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

