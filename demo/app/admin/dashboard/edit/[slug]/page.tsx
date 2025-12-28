'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'
import ConfirmModal from '@/components/ConfirmModal'

// Force dynamic rendering - this page uses browser-only APIs
export const dynamic = 'force-dynamic'

type PostStatus = 'draft' | 'published' | 'scheduled'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date: string
  author?: string
  status?: PostStatus
  scheduledDate?: string
  categories?: string[]
  tags?: string[]
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
}

interface Tag {
  id: string
  name: string
  slug: string
  description?: string
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

export default function EditPostPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  // Decode the slug parameter (handles URL-encoded spaces and special characters)
  const slug = decodeURIComponent(params.slug as string)
  // Get locale from URL query parameter
  const urlLocale = searchParams.get('locale')
  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState<PostStatus>('published')
  const [scheduledDate, setScheduledDate] = useState('')
  const [locale, setLocale] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string; onConfirm?: () => void }>({ isOpen: false, message: '' })
  const [config, setConfig] = useState<SiteConfig>({ siteTitle: 'My Blog', siteSubtitle: 'Welcome to our simple file-based CMS', postRoute: 'posts', pageRoute: '', defaultLocale: 'en', locales: [] })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const router = useRouter()
  const userChangedLocale = useRef(false) // Track if user manually changed locale

  useEffect(() => {
    // Reset user changed locale flag when slug changes (new post being edited)
    userChangedLocale.current = false
    
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
  }, [slug])

  // Load categories and tags when locale changes
  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      const localeToUse = locale || config.defaultLocale || 'en'
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch(`/api/categories?locale=${localeToUse}`),
          fetch(`/api/tags?locale=${localeToUse}`)
        ])
        
        if (categoriesRes.ok) {
          const categories = await categoriesRes.json()
          setAvailableCategories(categories)
        }
        
        if (tagsRes.ok) {
          const tags = await tagsRes.json()
          setAvailableTags(tags)
        }
      } catch (err) {
        console.error('Failed to load categories/tags:', err)
      }
    }
    
    if (locale || config.defaultLocale) {
      loadCategoriesAndTags()
    }
  }, [locale, config.defaultLocale])

  // Initialize locale when config loads or URL locale changes (only if user didn't manually change it)
  useEffect(() => {
    if (userChangedLocale.current) {
      // User manually changed locale, don't reset it
      return
    }
    if (urlLocale && config.locales?.some((l: Locale) => l.code === urlLocale && l.enabled)) {
      setLocale(urlLocale)
    } else if (config.defaultLocale && !locale) {
      setLocale(config.defaultLocale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.defaultLocale, config.locales, urlLocale])

  // Load post when slug or URL locale changes (initial load)
  // Don't reload when locale state changes (that's handled by the select onChange)
  useEffect(() => {
    if ((urlLocale || config.defaultLocale) && config.locales && config.locales.length > 0 && !post) {
      const localeToUse = urlLocale || config.defaultLocale
      loadPost(localeToUse)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, urlLocale, config.defaultLocale, config.locales])

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
        // Set locale from URL parameter first, then default locale
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

  const loadPost = async (postLocale?: string, showLoading: boolean = true) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const localeToUse = postLocale || locale || config.defaultLocale
      // Include drafts and scheduled posts for admin panel
      const response = await fetch(`/api/posts?locale=${localeToUse}&includeDrafts=true&includeScheduled=true`)
      if (response.ok) {
        const posts: Post[] = await response.json()
        const foundPost = posts.find(p => p.slug === slug)
        if (foundPost) {
          setPost(foundPost)
          setTitle(foundPost.title)
          setPostSlug(foundPost.slug)
          setContent(foundPost.content)
          setExcerpt(foundPost.excerpt || '')
          setAuthor(foundPost.author || '')
          setStatus(foundPost.status || 'published')
          setSelectedCategories(foundPost.categories || [])
          setSelectedTags(foundPost.tags || [])
          // Format scheduledDate for datetime-local input (YYYY-MM-DDTHH:mm)
          if (foundPost.scheduledDate) {
            const date = new Date(foundPost.scheduledDate)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            setScheduledDate(`${year}-${month}-${day}T${hours}:${minutes}`)
          } else {
            setScheduledDate('')
          }
          // Set locale if not already set
          if (!locale && localeToUse) {
            setLocale(localeToUse)
          }
        } else {
          // Post not found in requested locale - create empty post structure
          // Don't pre-fill with content from other locales - start fresh
          setPost({
            id: `post-${Date.now()}`,
            title: '',
            slug: slug,
            content: '',
            excerpt: '',
            date: new Date().toISOString(),
            author: ''
          })
          setTitle('')
          setPostSlug(slug)
          setContent('')
          setExcerpt('')
          setAuthor('')
          setStatus('published')
          setScheduledDate('')
          setSelectedCategories([])
          setSelectedTags([])
          setLocale(localeToUse)
        }
      } else {
        setErrorModal({
          isOpen: true,
          message: 'Failed to load post',
          onConfirm: () => {
            setErrorModal({ isOpen: false, message: '' })
            router.push('/admin/dashboard')
          }
        })
      }
    } catch (err) {
      setErrorModal({
        isOpen: true,
        message: 'Error loading post',
        onConfirm: () => {
          setErrorModal({ isOpen: false, message: '' })
          router.push('/admin/dashboard')
        }
      })
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const postRouteCapitalized = postRoute ? (postRoute.charAt(0).toUpperCase() + postRoute.slice(1)) : ''
  const slugChanged = post && post.slug && postSlug !== post.slug

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

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    // Auto-generate excerpt from content if excerpt is empty or matches previous auto-generated one
    const currentExcerpt = excerpt || (post?.excerpt || '')
    if (!currentExcerpt || currentExcerpt === generateExcerpt(content)) {
      setExcerpt(generateExcerpt(newContent))
    }
  }

  // Auto-save as draft when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (post) {
        const hasChanges = 
          title !== post.title || 
          content !== post.content || 
          postSlug !== post.slug || 
          excerpt !== (post.excerpt || '') || 
          author !== (post.author || '')
        if (hasChanges) {
          saveDraft()
        }
      } else if (title || content) {
        // New post with content - save draft
        saveDraft()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [title, content, postSlug, excerpt, author, post])

  const saveDraft = async () => {
    if (!post && !title && !content) return // Nothing to save

    const hasChanges = post ? (
      title !== post.title ||
      postSlug !== post.slug ||
      content !== post.content ||
      excerpt !== (post.excerpt || '') ||
      author !== (post.author || '') ||
      status !== (post.status || 'published') ||
      scheduledDate !== (post.scheduledDate || '')
    ) : (title || content) // If no post, any content is a change

    if (!hasChanges) return

    try {
      const token = localStorage.getItem('admin_token')
      
      // Save to localStorage as backup
      const draftData = {
        title,
        slug: postSlug || slug,
        content,
        excerpt,
        author,
        status,
        scheduledDate,
        date: post?.date || new Date().toISOString(),
        isDraft: true,
        originalSlug: post?.slug || slug
      }
      localStorage.setItem(`draft_${postSlug || slug}`, JSON.stringify(draftData))

      // Save to server as draft (only if post exists)
      if (post && post.slug) {
        await fetch(`/api/posts/${post.slug}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            slug: post.slug, // Keep original slug for draft saves
            content,
            excerpt,
            author,
            status,
            scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
            date: post.date,
            locale: locale || config.defaultLocale
          })
        })
      }
    } catch (err) {
      console.log('Draft saved to localStorage')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('admin_token')
      const finalSlug = postSlug || title.toLowerCase().replace(/\s+/g, '-')
      const currentLocale = locale || urlLocale || config.defaultLocale
      
      // Check if post exists in the current locale
      const checkResponse = await fetch(`/api/posts?locale=${currentLocale}`)
      let postExists = false
      if (checkResponse.ok) {
        const posts: Post[] = await checkResponse.json()
        postExists = posts.some(p => p.slug === slug)
      }
      
      // If slug changed and post exists, we need to create new and delete old
      if (slugChanged && post && postExists) {
        // Create new post with new slug
        const createResponse = await fetch('/api/posts', {
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
            date: post.date,
            locale: currentLocale
          })
        })

        if (!createResponse.ok) {
          const data = await createResponse.json()
          setSaving(false)
          setErrorModal({
            isOpen: true,
            message: data.error || 'Failed to create new post'
          })
          return
        }

        // Delete old post
        const deleteResponse = await fetch(`/api/posts/${post.slug}?locale=${currentLocale}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!deleteResponse.ok) {
          setErrorModal({
            isOpen: true,
            message: 'New post created but failed to delete old post. Please delete it manually.'
          })
        }
      } else if (!postExists || !post) {
        // Post doesn't exist in this locale - create new one
        const createResponse = await fetch('/api/posts', {
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
            date: post?.date || new Date().toISOString(),
            locale: currentLocale,
            categories: selectedCategories,
            tags: selectedTags
          })
        })

        if (!createResponse.ok) {
          const data = await createResponse.json()
          setSaving(false)
          setErrorModal({
            isOpen: true,
            message: data.error || 'Failed to create post'
          })
          return
        }
      } else {
        // Normal update - post exists in this locale
        const response = await fetch(`/api/posts/${post.slug}`, {
          method: 'PUT',
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
            date: post.date || new Date().toISOString(),
            locale: currentLocale
          })
        })

        if (!response.ok) {
          const data = await response.json()
          setSaving(false)
          setErrorModal({
            isOpen: true,
            message: data.error || 'Failed to update post'
          })
          return
        }
      }

      // Clear draft from localStorage
      localStorage.removeItem(`draft_${postSlug}`)
      
      // Redirect back to dashboard with the locale preserved
      router.push(`/admin/dashboard?locale=${currentLocale}`)
    } catch (err) {
      setSaving(false)
      setErrorModal({
        isOpen: true,
        message: 'Error saving post'
      })
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <p>Loading...</p>
      </main>
    )
  }

  // Don't render if not on localhost
  if (!isLocalhost) {
    return null
  }

  // Show form even if post doesn't exist (allows creating new post in new locale)
  // post will be set with empty/default values if not found

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {post && post.title ? `Edit ${postRouteCapitalized || 'Post'}` : `Create ${postRouteCapitalized || 'Post'} in ${config.locales?.find(l => l.code === locale)?.name || locale}`}
          </h1>
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
            onChange={(e) => setTitle(e.target.value)}
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
            Slug {slugChanged && <span style={{ color: '#ff9800', fontSize: '0.9rem' }}>(changing slug will create a new {postRouteCapitalized || 'post'})</span>}
          </label>
          <input
            type="text"
            value={postSlug}
            onChange={(e) => setPostSlug(e.target.value)}
            placeholder="my-post-title"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: slugChanged ? '2px solid #ff9800' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
              backgroundColor: 'white',
              cursor: 'text'
            }}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            URL will be: <span style={{ fontFamily: 'monospace', color: '#0070f3' }}>
              {postRoute ? `/${postRoute}/${postSlug || 'your-slug'}` : `/${postSlug || 'your-slug'}`}
            </span>
          </p>
          {slugChanged && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
              ⚠️ Changing the slug will create a new {postRouteCapitalized || 'post'} and delete the old one.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Locale *
          </label>
          <select
            value={locale || config.defaultLocale}
            onChange={(e) => {
              const newLocale = e.target.value
              userChangedLocale.current = true // Mark that user manually changed locale
              setLocale(newLocale)
              // Update URL to reflect the new locale
              router.push(`/admin/dashboard/edit/${encodeURIComponent(slug)}?locale=${newLocale}`, { scroll: false })
              // Reload post with new locale (without showing loading state)
              loadPost(newLocale, false)
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
            Select the language for this post. Changing locale will load the post in that language if it exists.
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
              const newStatus = e.target.value as PostStatus
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

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Categories
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {availableCategories.map((category) => (
              <label
                key={category.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: selectedCategories.includes(category.slug) ? '#0070f3' : 'white',
                  color: selectedCategories.includes(category.slug) ? 'white' : '#333'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.slug)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, category.slug])
                    } else {
                      setSelectedCategories(selectedCategories.filter(c => c !== category.slug))
                    }
                  }}
                  style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                />
                {category.name}
              </label>
            ))}
          </div>
          {availableCategories.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
              No categories available. Create categories in the admin panel.
            </p>
          )}
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            Select one or more categories for this post.
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Tags
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {availableTags.map((tag) => (
              <label
                key={tag.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: selectedTags.includes(tag.slug) ? '#28a745' : 'white',
                  color: selectedTags.includes(tag.slug) ? 'white' : '#333'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.slug)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTags([...selectedTags, tag.slug])
                    } else {
                      setSelectedTags(selectedTags.filter(t => t !== tag.slug))
                    }
                  }}
                  style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                />
                {tag.name}
              </label>
            ))}
          </div>
          {availableTags.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
              No tags available. Create tags in the admin panel.
            </p>
          )}
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            Select one or more tags for this post.
          </p>
        </div>

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

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {status === 'draft' && (
            <Link
              href={`${config.postRoute ? `/${config.postRoute}/${postSlug || slug}` : `/${postSlug || slug}`}?preview=true`}
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
            {saving 
              ? (post && post.title ? 'Updating...' : 'Creating...') 
              : (post && post.title ? `Update ${postRouteCapitalized || 'Post'}` : `Create ${postRouteCapitalized || 'Post'}`)
            }
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={errorModal.isOpen}
        title="Error"
        message={errorModal.message}
        confirmText="OK"
        onConfirm={() => {
          setErrorModal({ isOpen: false, message: '' })
          if (errorModal.onConfirm) {
            errorModal.onConfirm()
          }
        }}
        onCancel={() => {
          setErrorModal({ isOpen: false, message: '' })
          if (errorModal.onConfirm) {
            errorModal.onConfirm()
          }
        }}
        variant="info"
      />
    </main>
  )
}

