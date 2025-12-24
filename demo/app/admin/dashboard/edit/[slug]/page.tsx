'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'
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

export default function EditPostPage() {
  const params = useParams()
  // Decode the slug parameter (handles URL-encoded spaces and special characters)
  const slug = decodeURIComponent(params.slug as string)
  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string; onConfirm?: () => void }>({ isOpen: false, message: '' })
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
    loadPost()
  }, [slug])

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
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const loadPost = async () => {
    try {
      const response = await fetch('/api/posts')
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
        } else {
          setErrorModal({
            isOpen: true,
            message: 'Post not found',
            onConfirm: () => {
              setErrorModal({ isOpen: false, message: '' })
              router.push('/admin/dashboard')
            }
          })
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
      setLoading(false)
    }
  }

  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const postRouteCapitalized = postRoute ? (postRoute.charAt(0).toUpperCase() + postRoute.slice(1)) : ''
  const slugChanged = post && postSlug !== post.slug

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
      if (post && (title !== post.title || content !== post.content || postSlug !== post.slug || excerpt !== post.excerpt || author !== post.author)) {
        saveDraft()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [title, content, postSlug, excerpt, author, post])

  const saveDraft = async () => {
    if (!post) return

    const hasChanges = 
      title !== post.title ||
      postSlug !== post.slug ||
      content !== post.content ||
      excerpt !== (post.excerpt || '') ||
      author !== (post.author || '')

    if (!hasChanges) return

    try {
      const token = localStorage.getItem('admin_token')
      
      // Save to localStorage as backup
      const draftData = {
        title,
        slug: postSlug,
        content,
        excerpt,
        author,
        date: post.date,
        isDraft: true,
        originalSlug: post.slug
      }
      localStorage.setItem(`draft_${postSlug}`, JSON.stringify(draftData))

      // Save to server as draft (keep original slug to avoid conflicts)
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
          date: post.date
        })
      })
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
      
      // If slug changed, we need to create new and delete old
      if (slugChanged && post) {
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
            date: post.date
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
        const deleteResponse = await fetch(`/api/posts/${post.slug}`, {
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
      } else {
        // Normal update
        const response = await fetch(`/api/posts/${post?.slug}`, {
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
            date: post?.date || new Date().toISOString()
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
      
      router.push('/admin/dashboard')
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

  if (!post) {
    return (
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <p>Post not found</p>
        <Link href="/admin/dashboard">Back to Dashboard</Link>
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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Edit {postRouteCapitalized || 'Post'}</h1>
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem',
            padding: '0.5rem',
            background: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            <span style={{ fontWeight: '500' }}>{postRouteCapitalized || 'Post'} Route Prefix:</span>
            <span style={{ 
              background: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              {postRoute ? `/${postRoute}/` : '(root)'}
            </span>
          </div>
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
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: saving ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Updating...' : `Update ${postRouteCapitalized || 'Post'}`}
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

